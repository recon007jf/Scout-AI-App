
import streamlit as st
import pandas as pd
import gspread
from google.oauth2.service_account import Credentials
import os
import base64
from recon_agent import process_single_lead, get_google_sheet_client, GOOGLE_SHEET_NAME, WORKSHEET_NAME
from dotenv import load_dotenv
import re
import time

# Load environment variables
load_dotenv()

# Page Config
st.set_page_config(
    page_title="Point C Scout",
    page_icon="🦅",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- PASSWORD PROTECTION ---
def check_password():
    """Returns `True` if the user had the correct password."""
    if "password_correct" not in st.session_state:
        st.session_state.password_correct = False

    if st.session_state.password_correct:
        return True

    st.markdown("### 🔒 Login Required")
    with st.form("login_form"):
        pwd = st.text_input("Enter Password:", type="password")
        submitted = st.form_submit_button("Log In")
    
    if submitted:
        if pwd == "scout2025":  # Simple hardcoded password
            st.session_state.password_correct = True
            st.rerun()
        else:
            st.error("❌ Incorrect Password")
            
    return False

if not check_password():
    st.stop()

# --- APP START ---
# Load Custom CSS
def local_css():
    with open("assets/style.css") as f:
        st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

try:
    local_css()
except FileNotFoundError:
    st.warning("CSS file not found.")

# --- Google Sheets Connection ---
@st.cache_data(ttl=60)
def load_data():
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds_file = 'credentials.json'
    
    if not os.path.exists(creds_file):
        st.error(f"❌ Credentials file not found: {creds_file}")
        return pd.DataFrame()
        
    try:
        creds = Credentials.from_service_account_file(creds_file, scopes=scope)
        client = gspread.authorize(creds)
        sheet = client.open('Scout Leads').worksheet('Sheet1')
        data = sheet.get_all_records()
        return pd.DataFrame(data)
    except Exception as e:
        st.error(f"Error loading data: {e}")
        return pd.DataFrame()

def extract_archetype(dossier_text):
    """Extracts the Archetype from the dossier text."""
    if not isinstance(dossier_text, str): return "Unknown"
    match = re.search(r'Archetype:\s*(.+)', dossier_text, re.IGNORECASE)
    if match:
        return match.group(1).strip()
    match_disc = re.search(r'DISC:\s*([DISC])', dossier_text, re.IGNORECASE)
    if match_disc:
        return f"DISC: {match_disc.group(1).upper()}"
    return "Unknown"

def parse_dossier(dossier_text):
    """Parses the dossier text into a dictionary."""
    if not isinstance(dossier_text, str): return {}
    
    data = {}
    # Extract fields using regex
    patterns = {
        'Archetype': r'Archetype:\s*(.+)',
        'Driver': r'Driver:\s*(.+)',
        'Evidence': r'Evidence:\s*(.+)',
        'Hook': r'Hook:\s*(.+)',
    }
    
    for key, pattern in patterns.items():
        match = re.search(pattern, dossier_text, re.IGNORECASE)
        if match:
            data[key] = match.group(1).strip()
            
    # Extract Pain Points (multi-line)
    pain_points = []
    if "Pain Points:" in dossier_text:
        parts = dossier_text.split("Pain Points:")
        if len(parts) > 1:
            lines = parts[1].strip().split('\n')
            for line in lines:
                cleaned = line.strip().lstrip('-').strip()
                if cleaned and not cleaned.startswith("ERROR:"):
                    pain_points.append(cleaned)
    data['Pain_Points'] = pain_points
    
    return data

# --- Main App ---
def main():
    # Sidebar
    with st.sidebar:
        st.title("⚡️ Scout")
        st.markdown("---")
        
        st.markdown("### 🏢 Organization")
        st.markdown("Point C Health")
        
        st.markdown("### 📁 Folders")
        st.markdown("- **All Leads**")
        st.markdown("- Active")
        st.markdown("- Archived")
        
        st.markdown("---")
        st.markdown("### 🧠 Archetypes")
        st.markdown("""
        <div style="font-size: 0.8rem; line-height: 1.5;">
        <span style="color: #d32f2f; font-weight: bold;">CTRL</span> <b>The Controller</b><br>
        <i>Values Power & Customization</i><br><br>
        <span style="color: #7b1fa2; font-weight: bold;">STAR</span> <b>The Social Climber</b><br>
        <i>Values Status & Reputation</i><br><br>
        <span style="color: #388e3c; font-weight: bold;">GRDN</span> <b>The Guardian</b><br>
        <i>Values Safety & Stability</i><br><br>
        <span style="color: #1976d2; font-weight: bold;">ANLY</span> <b>The Analyst</b><br>
        <i>Values Logic & Data</i>
        </div>
        """, unsafe_allow_html=True)

        st.markdown("---")
        st.markdown("### ⚡️ Actions")
        
        if st.button("🔄 Refresh Data"):
            st.cache_data.clear()
            st.rerun()
            
        if st.button("♻️ Fix Incomplete Leads"):
            with st.spinner("Scanning and repairing..."):
                # Connect to sheet
                client = get_google_sheet_client()
                if client:
                    sheet = client.open(GOOGLE_SHEET_NAME).worksheet(WORKSHEET_NAME)
                    data = sheet.get_all_records()
                    headers = sheet.row_values(1)
                    
                    fixed_count = 0
                    progress_bar = st.progress(0)
                    status_text = st.empty()
                    
                    # Identify incomplete rows
                    incomplete_indices = []
                    for idx, row in enumerate(data):
                        dossier = row.get('Dossier Summary', '')
                        email = row.get('Draft Email', '')
                        if "Archetype: Unknown" in dossier or not dossier or not email:
                            incomplete_indices.append(idx)
                    
                    total_incomplete = len(incomplete_indices)
                    
                    if total_incomplete == 0:
                        st.success("✅ No incomplete leads found!")
                    else:
                        for i, idx in enumerate(incomplete_indices):
                            row = data[idx]
                            full_name = f"{row.get('First Name', '')} {row.get('Last Name', '')}"
                            status_text.text(f"Fixing {i+1}/{total_incomplete}: {full_name}")
                            
                            # Row index in sheet is idx + 2
                            process_single_lead(idx + 2, row, headers, sheet)
                            fixed_count += 1
                            progress_bar.progress((i + 1) / total_incomplete)
                            
                        st.success(f"✅ Fixed {fixed_count} leads!")
                        time.sleep(2)
                        st.cache_data.clear()
                        st.rerun()

    # Main Content
    df = load_data()
    
    # Header
    c1, c2, c3 = st.columns([3, 1, 1])
    with c1:
        st.title("Leads")
    with c2:
        st.text("") # Spacer
    with c3:
        if not df.empty:
            csv = df.to_csv(index=False).encode('utf-8')
            st.download_button("⬇️ Export All", csv, "leads.csv", "text/csv")

    if df.empty:
        st.info("No data found.")
        return

    # Filters Bar
    f1, f2 = st.columns([3, 1])
    with f1:
        search_term = st.text_input("Filter leads...", placeholder="Search by name, firm, or keyword...")
    with f2:
        status_filter = st.selectbox("Status", ["All"] + list(df['Status'].unique()) if 'Status' in df.columns else ["All"])

    # Apply Filters
    filtered_df = df.copy()
    if search_term:
        filtered_df = filtered_df[
            filtered_df['First Name'].str.contains(search_term, case=False, na=False) | 
            filtered_df['Last Name'].str.contains(search_term, case=False, na=False) |
            filtered_df['Firm'].str.contains(search_term, case=False, na=False)
        ]
    if status_filter != "All":
        filtered_df = filtered_df[filtered_df['Status'] == status_filter]

    st.markdown("<br>", unsafe_allow_html=True)
    
    # Column Headers (Visual only)
    st.markdown("""
    <div style="display: flex; padding: 0 20px; margin-bottom: 10px; color: #8b949e; font-size: 0.8rem; font-weight: 600; text-transform: uppercase;">
        <div style="width: 56px;"></div>
        <div style="flex: 2;">Lead / Firm</div>
        <div style="width: 120px; text-align: center;">Archetype</div>
        <div style="flex: 2;">Labels</div>
        <div style="width: 100px;"></div>
    </div>
    """, unsafe_allow_html=True)

    # List Rows
    for index, row in filtered_df.iterrows():
        # Data Prep
        first = row.get('First Name', '')
        last = row.get('Last Name', '')
        firm = row.get('Firm', '')
        status = row.get('Status', '')
        dossier = row.get('Dossier Summary', '')
        
        # Initials for Avatar (Fallback)
        first = row.get('First Name', '?')
        last = row.get('Last Name', '?')
        initials = (first[0] if first else "") + (last[0] if last else "")
        
        # Profile Image
        profile_img = row.get('Profile Image', '')
        if profile_img:
            icon_html = f'<img src="{profile_img}" class="col-icon-img">'
        else:
            icon_html = f'<div class="col-icon">{initials}</div>'
        
        # Archetype Badge
        archetype = extract_archetype(dossier)
        
        # Badge Styling
        badge_color = "#9e9e9e" # Default Gray
        badge_text = "UNK"
        
        if "Controller" in archetype: 
            badge_color = "#d32f2f" # Red
            badge_text = "CTRL"
        elif "Social Climber" in archetype: 
            badge_color = "#7b1fa2" # Purple
            badge_text = "STAR"
        elif "Guardian" in archetype: 
            badge_color = "#388e3c" # Green
            badge_text = "GRDN"
        elif "Analyst" in archetype: 
            badge_color = "#1976d2" # Blue
            badge_text = "ANLY"
        elif "DISC" in archetype:
            badge_text = archetype.split(": ")[1]
            if "D" in badge_text: badge_color = "#d32f2f"
            elif "I" in badge_text: badge_color = "#fbc02d"
            elif "S" in badge_text: badge_color = "#388e3c"
            elif "C" in badge_text: badge_color = "#1976d2"
        
        # Labels Logic
        labels_html = ""
        if "Found" in status:
            labels_html += '<span class="label-pill active">Active</span>'
        if row.get('Found Email'):
            labels_html += '<span class="label-pill">Email</span>'
        if row.get('LinkedIn URL'):
            labels_html += '<span class="label-pill">LinkedIn</span>'
        if row.get('Draft Email'):
            labels_html += '<span class="label-pill">Draft Ready</span>'

        # Row HTML
        row_html = f"""
        <div class="lead-row">
            {icon_html}
            <div class="col-name">
                <span class="name-text">{first} {last}</span>
                <span class="firm-text">{firm}</span>
            </div>
            <div class="col-rating">
                <div class="rating-badge" style="background-color: {badge_color};">{badge_text}</div>
            </div>
            <div class="col-labels">
                {labels_html}
            </div>
        </div>
        """
        st.markdown(row_html, unsafe_allow_html=True)
        
        # Hidden Details (Merged visually via CSS)
        with st.expander("Show Details"):
            c1, c2 = st.columns([2, 1])
            with c1:
                st.markdown(f"**Email:** `{row.get('Found Email', 'N/A')}`")
                st.markdown(f"**LinkedIn:** {row.get('LinkedIn URL', 'N/A')}")
                
                # Podcast Display
                pod_name = row.get('Podcast Name')
                pod_url = row.get('Podcast URL')
                if pod_name and pd.notna(pod_name):
                    st.markdown(f"### 🎙️ Podcast Host")
                    st.markdown(f"**{pod_name}**")
                    if pod_url and pd.notna(pod_url):
                        st.markdown(f"[Listen Here]({pod_url})")
                
                if dossier:
                    st.markdown("### 🧠 Dossier")
                    # Check if it's JSON (old format) or Text (new format)
                    if "{" in dossier and "}" in dossier:
                        st.json(dossier)
                    else:
                        # Beautiful HTML Card
                        html = f"""<div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; margin-top: 15px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-family: 'Helvetica Neue', sans-serif;">
<div style="margin-bottom: 12px;">
<span style="font-weight: 700; color: #424242; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">Psychological Driver</span><br>
<span style="font-size: 1.1rem; color: #1a1a1a; font-style: italic; font-weight: 500;">"{data.get('Driver', 'Unknown')}"</span>
</div>
<div style="margin-bottom: 12px;">
<span style="font-weight: 700; color: #424242; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">Evidence</span><br>
<span style="font-size: 0.95rem; color: #616161; border-left: 3px solid #eeeeee; padding-left: 10px; display: block; margin-top: 4px;">
{data.get('Evidence', 'N/A')}
</span>
</div>
<div style="margin-bottom: 12px;">
<span style="font-weight: 700; color: #424242; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">Strategic Hook</span><br>
<span style="font-size: 0.95rem; color: #2e7d32;">{data.get('Hook', 'N/A')}</span>
</div>
<div>
<span style="font-weight: 700; color: #424242; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">Pain Points</span>
<ul style="margin-top: 5px; margin-bottom: 0; padding-left: 20px; color: #d32f2f; font-size: 0.9rem;">
{''.join([f'<li>{p}</li>' for p in data.get('Pain_Points', [])])}
</ul>
</div>
</div>"""
                        st.markdown(html, unsafe_allow_html=True)
                
                # Manual Email Override
                st.markdown("---")
                with st.form(key=f"email_edit_{index}"):
                    new_email = st.text_input("📝 Manually Update Email", value=row.get('Found Email', ''))
                    save_btn = st.form_submit_button("Save Email")
                    
                    if save_btn:
                        client = get_google_sheet_client()
                        if client:
                            sheet = client.open(GOOGLE_SHEET_NAME).worksheet(WORKSHEET_NAME)
                            headers = sheet.row_values(1)
                            try:
                                email_col = headers.index("Found Email") + 1
                                # Row index is index + 2 (0-based df index -> 1-based sheet row + header)
                                sheet.update_cell(index + 2, email_col, new_email)
                                st.success("✅ Email Updated!")
                                time.sleep(1)
                                st.rerun()
                            except ValueError:
                                st.error("Could not find 'Found Email' column.")
                
                if row.get('Draft Email'):
                    st.text_area("Draft Email", row.get('Draft Email'), height=150)
                else:
                    st.warning("⚠️ Draft Email Missing (Rate Limit?)")
                    if st.button("🔄 Retry Generation", key=f"retry_{index}"):
                        with st.spinner("Retrying..."):
                            # Connect to sheet
                            client = get_google_sheet_client()
                            sheet = client.open(GOOGLE_SHEET_NAME).worksheet(WORKSHEET_NAME)
                            headers = sheet.row_values(1)
                            # Row index is index + 2 (1-based + header)
                            success = process_single_lead(index + 2, row, headers, sheet)
                            if success:
                                st.success("Done! Refreshing...")
                                st.rerun()
                            else:
                                st.error("Failed. Check logs.")

            with c2:
                single_row_df = pd.DataFrame([row])
                csv_single = single_row_df.to_csv(index=False).encode('utf-8')
                st.download_button("⬇️ Download CSV", csv_single, f"{last}_lead.csv", "text/csv", key=f"dl_{index}")

if __name__ == "__main__":
    main()
