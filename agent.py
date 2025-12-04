import csv
import os
import time
import json
import re
import requests
import gspread
from google.oauth2.service_account import Credentials
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# --- CONFIGURATION ---
INPUT_FILE = 'leads.csv'
GOOGLE_SHEET_NAME = 'Scout Leads'
WORKSHEET_NAME = 'Sheet1'
CREDS_FILE = 'credentials.json'
SERPER_API_KEY = os.getenv("SERPER_API_KEY")

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

def write_to_google_sheet(results):
    client = get_google_sheet_client()
    if not client: return
    print(f"\n📝 Connecting to Google Sheet: '{GOOGLE_SHEET_NAME}'...")
    try:
        sheet = client.open(GOOGLE_SHEET_NAME).worksheet(WORKSHEET_NAME)
        
        # Clear existing data to ensure a clean list
        sheet.clear()
        
        # Add Headers
        headers = ["First Name", "Last Name", "Firm", "Found Email", "LinkedIn URL", "Status", "Notes"]
        sheet.append_row(headers)
        
        rows_to_add = []
        for result in results:
            row = [
                result.get('First Name', ''),
                result.get('Last Name', ''),
                result.get('Firm', ''),
                result.get('Found Email', ''),
                result.get('LinkedIn URL', ''),
                result.get('Status', ''),
                result.get('Notes', '')
            ]
            rows_to_add.append(row)
        sheet.append_rows(rows_to_add)
        print(f"✅ Success! Overwrote sheet and uploaded {len(rows_to_add)} rows to '{GOOGLE_SHEET_NAME}'.")
    except Exception as e:
        print(f"❌ Error writing to Google Sheets: {e}")

def read_leads_from_csv(filename):
    leads = []
    if not os.path.exists(filename):
        print(f"❌ ERROR: Could not find '{filename}'.")
        return []
    try:
        with open(filename, mode='r', encoding='utf-8-sig') as file:
            reader = csv.DictReader(file)
            for row in reader:
                clean_row = {k.strip(): v.strip() for k, v in row.items() if k}
                leads.append(clean_row)
        print(f"✅ Successfully loaded {len(leads)} leads from {filename}.")
        return leads
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        return []

def search_google(query):
    if not SERPER_API_KEY:
        print("⚠️ Warning: SERPER_API_KEY not found in .env")
        return {}
    
    url = "https://google.serper.dev/search"
    payload = json.dumps({"q": query})
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }
    try:
        response = requests.request("POST", url, headers=headers, data=payload)
        return response.json()
    except Exception as e:
        print(f"❌ Error calling Serper API: {e}")
        return {}

def extract_email(text):
    match = re.search(r'[\w.+-]+@[\w-]+\.[\w.-]+', text)
    return match.group(0) if match else None

def extract_linkedin(text):
    # Regex to find linkedin profile urls
    match = re.search(r'https?://(www\.)?linkedin\.com/in/[\w-]+/?', text)
    return match.group(0) if match else None

def process_lead(lead):
    first_name = lead.get('First Name', 'Unknown')
    last_name = lead.get('Last Name', 'Unknown')
    firm = lead.get('Firm', 'Unknown')
    notes = lead.get('Notes', '')

    print(f"🔎 Processing: {first_name} {last_name} from {firm}...")
    
    # --- Step 1: Find Email ---
    email_query = f"{first_name} {last_name} {firm} email address contact"
    email_results = search_google(email_query)
    
    found_email = None
    if 'organic' in email_results:
        for item in email_results['organic']:
            snippet = item.get('snippet', '')
            title = item.get('title', '')
            email = extract_email(snippet) or extract_email(title)
            if email:
                found_email = email
                break
    
    status = ""
    if found_email:
        print(f"   -> 📧 Found Email: {found_email}")
        status = "Found via Search"
    else:
        domain = firm.lower().replace(" ", "").replace(",", "") + ".com"
        found_email = f"{first_name.lower()}.{last_name.lower()}@{domain}"
        status = "Guessed Email"
        print(f"   -> 🎲 Guessed Email: {found_email}")

    # --- Step 2: Find LinkedIn ---
    # Broader search query to handle name variations and firm abbreviations
    linkedin_query = f"{first_name} {last_name} {firm} linkedin"
    linkedin_results = search_google(linkedin_query)
    
    found_linkedin = "Not Found"
    if 'organic' in linkedin_results:
        for item in linkedin_results['organic']:
            link = item.get('link', '')
            if 'linkedin.com/in/' in link:
                found_linkedin = link
                break
    
    if found_linkedin != "Not Found":
        print(f"   -> 🔗 Found LinkedIn: {found_linkedin}")
    else:
        print(f"   -> ❌ LinkedIn Not Found")

    time.sleep(0.5) 

    return {
        "First Name": first_name,
        "Last Name": last_name,
        "Firm": firm,
        "Found Email": found_email,
        "LinkedIn URL": found_linkedin,
        "Status": status,
        "Notes": notes
    }

def main():
    print("--- 🤖 Starting Sales Bot (Email + LinkedIn) ---")
    leads = read_leads_from_csv(INPUT_FILE)
    if not leads: return

    # Process all leads
    leads_to_process = leads
    print(f"Processing all {len(leads_to_process)} leads...")

    results = []
    for lead in leads_to_process:
        try:
            result = process_lead(lead)
            results.append(result)
        except Exception as e:
            print(f"   ⚠️ Error processing {lead.get('First Name', 'Unknown')}: {e}")

    if results:
        write_to_google_sheet(results)
    else:
        print("No results generated.")

if __name__ == "__main__":
    main()
