import os
import time
import json
import requests
import gspread
import google.generativeai as genai
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# --- CONFIGURATION ---
GOOGLE_SHEET_NAME = 'Scout Leads'
WORKSHEET_NAME = 'Sheet1'
CREDS_FILE = 'credentials.json'
SERPER_API_KEY = os.getenv("SERPER_API_KEY")
SERPER_API_KEY = os.getenv("SERPER_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
SAFETY_LIMIT = 50 # 🛑 Max leads to process per run to prevent accidental overage

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash')

def generate_content_with_retry(prompt, retries=5, base_delay=10):
    """Wraps model.generate_content with exponential backoff for 429 errors."""
    for attempt in range(retries):
        try:
            return model.generate_content(prompt)
        except Exception as e:
            if "429" in str(e) or "quota" in str(e).lower():
                wait_time = base_delay * (2 ** attempt)  # Exponential backoff: 10, 20, 40, 80...
                print(f"   ⚠️ Rate Limit Hit. Waiting {wait_time}s before retry {attempt+1}/{retries}...")
                time.sleep(wait_time)
            else:
                raise e # Re-raise other errors
    raise Exception("Max retries exceeded for Gemini API.")

def get_google_sheet_client():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    if not os.path.exists(CREDS_FILE):
        print(f"❌ ERROR: Could not find '{CREDS_FILE}'.")
        return None
    try:
        creds = Credentials.from_service_account_file(CREDS_FILE, scopes=scope)
        client = gspread.authorize(creds)
        return client
    except Exception as e:
        print(f"❌ Error authenticating with Google: {e}")
        return None

def search_serper(query):
    if not SERPER_API_KEY:
        print("⚠️ Warning: SERPER_API_KEY not found")
        return ""
    
    url = "https://google.serper.dev/search"
    payload = json.dumps({"q": query})
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    try:
        response = requests.request("POST", url, headers=headers, data=payload)
        data = response.json()
        snippets = []
        if 'organic' in data:
            for item in data['organic']:
                snippets.append(item.get('snippet', ''))
        return " ".join(snippets)
    except Exception as e:
        print(f"❌ Error calling Serper API: {e}")
        return ""

def search_images(query):
    if not SERPER_API_KEY: return ""
    url = "https://google.serper.dev/images"
    payload = json.dumps({"q": query})
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    try:
        response = requests.request("POST", url, headers=headers, data=payload)
        data = response.json()
        if 'images' in data and len(data['images']) > 0:
            return data['images'][0].get('imageUrl', '')
    except Exception as e:
        print(f"❌ Error calling Serper Images API: {e}")
    return ""

def gather_intel(name, firm, existing_linkedin_url=None):
    print(f"   🕵️ Gathering Intel for {name}...")
    
    # 1. Bio Data
    # Use existing URL if valid, otherwise search
    if existing_linkedin_url and 'linkedin.com/in/' in existing_linkedin_url:
        bio_query = f'site:{existing_linkedin_url}'
    else:
        # Strict search for CURRENT role at TARGET firm
        bio_query = f'site:linkedin.com/in/ "{name}" "{firm}" "Present"'
    
    bio_text = search_serper(bio_query)
    
    # 2. Recent Activity
    posts_query = f'site:linkedin.com/posts/ "{name}" "{firm}"'
    posts_text = search_serper(posts_query)
    
    # 3. Articles
    pulse_query = f'site:linkedin.com/pulse/ "{name}"'
    pulse_text = search_serper(pulse_query)
    
    # 4. Profile Image (New)
    # Try to find a profile picture specifically from LinkedIn
    image_query = f'site:linkedin.com/in/ "{name}" "{firm}" profile picture'
    image_url = search_images(image_query)

    # 5. Deep Web (Bernays Protocol)
    # Podcasts / Interviews
    podcast_query = f'site:youtube.com OR site:spotify.com OR site:apple.com/podcasts "{name}" "{firm}" interview'
    podcast_text = search_serper(podcast_query)
    
    # News / PR
    news_query = f'"{name}" "{firm}" press release OR announced OR award OR speaker'
    news_text = search_serper(news_query)
    
    raw_intel = f"BIO:\n{bio_text}\n\nPOSTS:\n{posts_text}\n\nARTICLES:\n{pulse_text}\n\nPODCASTS/INTERVIEWS:\n{podcast_text}\n\nNEWS/PR:\n{news_text}"
    return raw_intel, image_url

def analyze_lead(raw_intel, name, firm):
    print(f"   🧠 Analyzing Lead...")
    prompt = f"""
    You are an expert in the "Bernays Protocol" of sales psychology. Your goal is to identify the UNCONSCIOUS DRIVER of this prospect.
    
    RAW INTEL:
    {raw_intel}
    
    ARCHETYPES (The 4 Hidden Drivers):
    1. The 'Controller' (Driver/Dominant): Values power, customization, and 'beating the system'. Hates bureaucracy. Keywords: "Strategic", "Custom", "Bottom-line", "Aggressive".
    2. The 'Social Climber' (Influencer/Status): Values reputation, relationships, and being seen as an 'Innovator'. Fears looking bad. Keywords: "Awards", "Power Broker", "Client wins".
    3. The 'Guardian' (Steady/Safety): Risk-averse, fears disruption. Worries about 'noise'. Keywords: "Stability", "Service", "Member Experience", "Trust".
    4. The 'Analyst' (Conscientious/Logic): Trusts data, skeptical of marketing. Wants proof. Keywords: "Charts", "Transparency", "Fiduciary Duty", "Analytics".
    
    CRITICAL INSTRUCTIONS:
    1. VERIFY FIRM MATCH: Ensure the intel relates to their CURRENT role at {firm}. Ignore past roles (e.g. previous companies) unless relevant to their current philosophy.
    2. IGNORE "Welcome user" or login text.
    3. Analyze their content (Podcasts, Posts) to find their TRUE driver.
    4. If unsure, default to 'The Guardian' (safest bet).
    4. OUTPUT MUST BE VALID JSON. Do not use single quotes for keys. Escape any quotes inside strings.
    
    Return a JSON object with:
    - 'psych_profile': (One of: "The Controller", "The Social Climber", "The Guardian", "The Analyst")
    - 'Unconscious_Desire': (A short phrase explaining WHAT they really want)
    - 'Archetype_Evidence': (A specific quote, post topic, or behavior from the intel that justifies this Archetype. e.g. "Posted about 'Winning the President's Club award' 3 times.")
    - 'Hook': (A specific sentence referencing their recent content/interview. If none, reference their role.)
    - 'Pain_Points': [List of 2 likely challenges based on their Archetype]
    - 'Podcast_Name': (Name of their podcast if they host one, else null)
    - 'Podcast_URL': (URL to the podcast if found, else null)
    - 'Podcast_URL': (URL to the podcast if found, else null)
    """
    try:
        response = generate_content_with_retry(prompt)
        text = response.text.strip()
        
        # Robust JSON extraction
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            json_str = match.group(0)
            return json.loads(json_str)
        else:
            print(f"❌ Error: No JSON found in response: {text[:100]}...")
            return {}
            
    except Exception as e:
        print(f"❌ Error analyzing lead: {e}")
        return {}

def write_email(analysis, first_name):
    print(f"   ✍️ Writing Email...")
    prompt = f"""Write a cold email to this broker.
    
    CRITICAL INSTRUCTION: Start the email with "Hi {first_name},"

    Strategy: Appeal to their Archetype: '{analysis.get('psych_profile', 'The Guardian')}'.
    
    - If 'The Controller': Appeal to Control. Strategy: 'Fully customizable plan designs' and 'boutique-level responsiveness'. "Get the control you want without losing network strength."
    - If 'The Social Climber': Appeal to Prestige. Strategy: 'White-glove service' and 'National Leader' status. "Exclusive partner that makes you look like a hero."
    - If 'The Guardian': Appeal to Safety. Strategy: Lead with Network Strength (Cigna/Aetna/Anthem). "Seamless stop-loss integration" and "Predictable service".
    - If 'The Analyst': Appeal to Truth/Efficiency. Strategy: Hard numbers. "Reduced PEPM by 12%", "Rx savings of 18%". Focus on "Data transparency & analytics".
    
    Hook: Use '{analysis.get('Hook', 'I noticed your work in the industry.')}'.
    Offer: Point C Health TPA.
    Constraint: Keep it under 100 words. No fluff.
    """
    try:
        response = generate_content_with_retry(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"❌ Error writing email: {e}")
        return ""

def guess_email_logic(name, firm, intel):
    """
    If email is missing, ask Gemini to guess it and explain why.
    """
    print(f"   🤔 Guessing Email for {name}...")
    prompt = f"""
    The email address for {name} at {firm} was NOT found in public searches.
    
    Based on the firm's likely domain and standard corporate patterns, provide:
    1. A Best Guess Email (e.g. first.last@company.com)
    2. A Reasonable Explanation for why it wasn't found (e.g. "Strict spam filters", "New role", "Small digital footprint", "Uses parent company domain").
    
    INTEL CONTEXT:
    {intel[:500]}...
    
    OUTPUT FORMAT:
    Return ONLY a JSON object:
    {{
        "guess": "name@company.com",
        "reason": "Explanation here..."
    }}
    """
    try:
        response = generate_content_with_retry(prompt)
        text = response.text.strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
    except Exception as e:
        print(f"❌ Error guessing email: {e}")
    
    return {"guess": "Unknown", "reason": "Could not generate guess."}

def process_single_lead(i, row, headers, sheet):
    """
    Processes a single lead row.
    Returns True if successful, False otherwise.
    """
    try:
        first_name = row.get('First Name', '')
        last_name = row.get('Last Name', '')
        firm = row.get('Firm', '')
        full_name = f"{first_name} {last_name}"
        linkedin_url = row.get('LinkedIn URL', '')
        
        if not linkedin_url:
            print(f"⏩ Skipping {full_name} (No LinkedIn URL)")
            return False

        print(f"\nProcessing Row {i}: {full_name}")
        
        # Step A: Intel
        raw_intel, image_url = gather_intel(full_name, firm, linkedin_url)
        
        # Step A.5: Email Guessing (If missing)
        found_email = row.get('Found Email', '')
        # Trigger if empty, "Not Found", or already a "GUESS"
        if not found_email or "Not Found" in found_email or "GUESS" in found_email:
            guess_data = guess_email_logic(full_name, firm, raw_intel)
            guess = guess_data.get('guess', 'N/A')
            reason = guess_data.get('reason', 'N/A')
            
            # Format: [GUESS] email (Reason: ...)
            new_email_val = f"[GUESS] {guess}\n(Reason: {reason})"
            
            # Update Sheet immediately
            try:
                email_col_idx = headers.index("Found Email") + 1
                sheet.update_cell(i, email_col_idx, new_email_val)
                print(f"   💡 Updated Email with Guess: {guess}")
            except ValueError:
                print("   ⚠️ 'Found Email' column not found.")
        
        # Step B: Analysis
        analysis = analyze_lead(raw_intel, full_name, firm)
        
        # Helper to clean text
        def clean(t): return str(t).replace('**', '').replace('__', '')
        
        # Convert JSON to readable text for the sheet
        dossier_text = f"""Archetype: {clean(analysis.get('psych_profile', 'Unknown'))}
Driver: {clean(analysis.get('Unconscious_Desire', 'Unknown'))}
Evidence: {clean(analysis.get('Archetype_Evidence', 'N/A'))}
Hook: {clean(analysis.get('Hook', 'N/A'))}
Pain Points:
- {clean(analysis.get('Pain_Points', [''])[0])}
- {clean(analysis.get('Pain_Points', ['',''])[1])}"""
        
        # Step C: Copywriting
        email_draft = write_email(analysis, first_name)
        
        # Step D: Save
        # Update Dossier
        dossier_col = headers.index("Dossier Summary") + 1
        sheet.update_cell(i, dossier_col, dossier_text)
        
        # Update Email
        email_col = headers.index("Draft Email") + 1
        sheet.update_cell(i, email_col, email_draft)
        
        # Update Image
        if image_url:
            img_col = headers.index("Profile Image") + 1
            sheet.update_cell(i, img_col, image_url)
            
        # Update Podcast Info (New)
        podcast_name = analysis.get('Podcast_Name')
        podcast_url = analysis.get('Podcast_URL')
        
        if podcast_name:
            try:
                pod_name_col = headers.index("Podcast Name") + 1
                sheet.update_cell(i, pod_name_col, podcast_name)
            except ValueError: pass # Column might not exist yet (handled in main)

        if podcast_url:
            try:
                pod_url_col = headers.index("Podcast URL") + 1
                sheet.update_cell(i, pod_url_col, podcast_url)
            except ValueError: pass
        
        print(f"   ✅ Saved Dossier, Draft, and Image for {full_name}")
        return True
        
    except Exception as e:
        print(f"❌ Error processing {full_name}: {e}")
        return False

def main():
    print("--- 🦅 Starting Deep Recon Agent ---")
    
    client = get_google_sheet_client()
    if not client: return
    
    try:
        sheet = client.open(GOOGLE_SHEET_NAME).worksheet(WORKSHEET_NAME)
        data = sheet.get_all_records()
        headers = sheet.row_values(1)
        
        # Add columns if missing
        if "Dossier Summary" not in headers:
            print("   ➕ Adding 'Dossier Summary' column...")
            sheet.update_cell(1, len(headers) + 1, "Dossier Summary")
            headers.append("Dossier Summary")
            
        if "Draft Email" not in headers:
            print("   ➕ Adding 'Draft Email' column...")
            sheet.update_cell(1, len(headers) + 1, "Draft Email")
            headers.append("Draft Email")
            
        if "Profile Image" not in headers:
            print("   ➕ Adding 'Profile Image' column...")
            sheet.update_cell(1, len(headers) + 1, "Profile Image")
            headers.append("Profile Image")

        if "Podcast Name" not in headers:
            print("   ➕ Adding 'Podcast Name' column...")
            sheet.update_cell(1, len(headers) + 1, "Podcast Name")
            headers.append("Podcast Name")
            
        if "Podcast URL" not in headers:
            print("   ➕ Adding 'Podcast URL' column...")
            sheet.update_cell(1, len(headers) + 1, "Podcast URL")
            headers.append("Podcast URL")

        processed_count = 0
        
        for i, row in enumerate(data, start=2):
            # Safety Check
            if processed_count >= SAFETY_LIMIT:
                print(f"\n🛑 SAFETY LIMIT REACHED: Stopped after {processed_count} leads to protect budget.")
                break

            # Filter: LinkedIn URL NOT empty
            linkedin_url = row.get('LinkedIn URL', '')
            if not linkedin_url: continue
                
            # Call the helper function
            if process_single_lead(i, row, headers, sheet):
                processed_count += 1
                
            time.sleep(1) # Rate limiting
            
    except Exception as e:
        print(f"❌ Error accessing sheet: {e}")

if __name__ == "__main__":
    main()
