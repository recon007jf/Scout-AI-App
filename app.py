import streamlit as st

st.set_page_config(page_title="Point C Scout", layout="wide")

from modules.command_center import run_command_center

# Load Custom CSS
with open("assets/style.css") as f:
    st.markdown(f"<style>{f.read()}</style>", unsafe_allow_html=True)

st.title("Point C Scout")
run_command_center()
