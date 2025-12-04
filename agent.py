import csv
import os
import time
import gspread
from google.oauth2.service_account import Credentials

# --- CONFIGURATION ---
# The file containing your target list
INPUT_FILE = 'leads.csv'

# The name of your Google Sheet (Must match exactly what is in your Drive)
GOOGLE_SHEET_NAME = 'Scout Leads'
WORKSHEET_NAME = 'Sheet1'  # Usually 'Sheet1', change if your tab is named 'Leads'

# The credentials file for your Service Account
CREDS_FILE = 'credentials.json'

def get_google_sheet_client():
    """
    Authenticates with Google and returns the spreadsheet client.
    """
    scope = [
        "https://spreadsheets.google.com/feeds", 
        "https://www.googleapis.com/auth/drive"
    ]
    
    if not os.path.exists(CREDS_FILE):
        print(f"❌ ERROR: Could not find '{CREDS_FILE}'. Cannot connect to Google Sheets.")
        return None

    try:
        creds = Credentials.from_service_account_file(CREDS_FILE, scopes=scope)
        client = gspread.authorize(creds)
        return client
    except Exception as e:
        print(f"❌ Error authenticating with Google: {e}")
        return None

def write_to_google_sheet(results):
    """
    Takes the list of processed results and appends them to the Google Sheet.
    """
    client = get_google_sheet_client()
    if not client:
        return

    print(f"\n📝 Connecting to Google Sheet: '{GOOGLE_SHEET_NAME}'...")
    
    try:
        # Open the sheet
        sheet = client.open(GOOGLE_SHEET_NAME).worksheet(WORKSHEET_NAME)
        
        # Prepare the rows for upload
        rows_to_add = []
        for result in results:
            # We convert the dictionary to a list ensuring the order matches your Sheet columns
            # Suggested Columns: First Name | Last Name | Firm | Found Email | Status | Notes
            row = [
                result.get('First Name', ''),
                result.get('Last Name', ''),
                result.get('Firm', ''),
                result.get('Found Email', ''),
                result.get('Status', ''),
                result.get('Notes', '')
            ]
            rows_to_add.append(row)
        
        # Append all rows at once
        sheet.append_rows(rows_to_add)
        print(f"✅ Success! Uploaded {len(rows_to_add)} rows to '{GOOGLE_SHEET_NAME}'.")
        print("   (Check the bottom of your sheet if you don't see them at the top!)")
        
    except gspread.exceptions.SpreadsheetNotFound:
        print(f"❌ Error: Could not find a Google Sheet named '{GOOGLE_SHEET_NAME}'.")
        print("   -> Please check the spelling exactly.")
        print("   -> Ensure you shared the sheet with the Service Account email.")
    except Exception as e:
        print(f"❌ Error writing to Google Sheets: {e}")

def read_leads_from_csv(filename):
    """
    Reads the CSV file and returns a list of dictionaries.
    """
    leads = []
    
    if not os.path.exists(filename):
        print(f"❌ ERROR: Could not find '{filename}'. Make sure it is in this folder.")
        return []

    try:
        with open(filename, mode='r', encoding='utf-8-sig') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Basic cleanup: strip whitespace from keys and values
                clean_row = {k.strip(): v.strip() for k, v in row.items() if k}
                leads.append(clean_row)
        
        print(f"✅ Successfully loaded {len(leads)} leads from {filename}.")
        return leads
    
    except Exception as e:
        print(f"❌ Error reading CSV: {e}")
        return []

def process_lead(lead):
    """
    This is the 'Brain' of your bot. 
    It takes one lead (person) and performs the work (Search, Find Email, etc.).
    """
    first_name = lead.get('First Name', 'Unknown')
    last_name = lead.get('Last Name', 'Unknown')
    firm = lead.get('Firm', 'Unknown')
    tier = lead.get('Tier', 'Unknown')
    notes = lead.get('Notes', '')

    print(f"🔎 Processing: {first_name} {last_name} from {firm}...")

    # ============================================================
    # 👇 YOUR AGENT / BOT LOGIC GOES HERE 👇
    # Currently, this simulates finding an email so you can test the pipeline.
    # Replace the lines below with your actual scraping function when ready.
    # ============================================================
    
    time.sleep(0.5) # Simulate work
    
    # Placeholder Logic: Generate a fake email based on the firm
    domain = firm.lower().replace(' ', '').replace(',', '') + ".com"
    found_email = f"{first_name.lower()}.{last_name.lower()}@{domain}"
    
    print(f"   -> Simulating Result: {found_email}")
    
    # ============================================================
    
    # Return the structured data to be saved
    return {
        "First Name": first_name,
        "Last Name": last_name,
        "Firm": firm,
        "Found Email": found_email,
        "Status": "Processed",
        "Notes": notes
    }

def main():
    print("--- 🤖 Starting Sales Bot for Andrew Oram ---")
    
    # 1. Load the Data from CSV
    leads = read_leads_from_csv(INPUT_FILE)
    
    if not leads:
        print("No leads to process. Exiting.")
        return

    # 2. Loop through the leads and process them
    results = []
    for lead in leads:
        try:
            result = process_lead(lead)
            results.append(result)
        except Exception as e:
            print(f"   ⚠️ Error processing {lead.get('First Name', 'Unknown')}: {e}")

    # 3. Write all results to Google Sheets
    if results:
        write_to_google_sheet(results)
    else:
        print("No results generated.")

if __name__ == "__main__":
    main()
