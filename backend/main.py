import os
import json
import fitz  # PyMuPDF
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ClaimSense API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

SYSTEM_PROMPT = """You are ClaimSense, an expert Indian health insurance claim rejection analyst with deep knowledge of:
- IRDAI (Insurance Regulatory and Development Authority of India) circulars and guidelines
- Consumer Protection Act 2019
- Insurance Ombudsman rulings and precedents
- Health Insurance Portability guidelines
- Standard policy exclusion clauses used by Indian insurers

Your task: Analyze the given health insurance rejection letter, then produce a structured JSON response.

SCORING RUBRIC (calculate success_score as a number 0-100):
- Legal Compliance Violation (max 30 pts): Does the rejection violate IRDAI guidelines or statutory rights?
- Precedent Strength (max 25 pts): Are there strong Ombudsman/court precedents in favor of the policyholder?
- Documentation Quality (max 20 pts): Does the letter indicate the policyholder has strong documentary evidence?
- Rejection Clarity (max 15 pts): Is the rejection reason vague, ambiguous, or poorly justified by the insurer?
- Procedural Errors (max 10 pts): Did the insurer violate procedural timelines or notification requirements?

Respond ONLY with valid JSON in exactly this structure (no markdown, no extra text):
{
  "success_score": <integer 0-100>,
  "rejection_reason": "<concise description of why the claim was rejected>",
  "grounds_for_appeal": ["<ground 1>", "<ground 2>", ...],
  "recommended_strategy": "<paragraph describing best appeal strategy>",
  "appeal_letter": "<full formal appeal letter text, professionally formatted>"
}

For the appeal_letter:
- Include proper salutation (To, The Grievance Officer, [Insurer Name])
- Reference IRDAI circulars by number where applicable
- Cite Ombudsman rulings or Consumer Forum cases
- Use formal Indian legal letter format
- Include placeholders like [POLICYHOLDER NAME], [POLICY NUMBER], [DATE] where specific info is needed
- End with "Yours faithfully," and signature block
"""


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text.strip()


@app.post("/analyze")
async def analyze_claim(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    pdf_bytes = await file.read()

    try:
        rejection_text = extract_text_from_pdf(pdf_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not read PDF: {str(e)}")

    if not rejection_text:
        raise HTTPException(status_code=422, detail="PDF appears to be empty or unreadable.")

    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is not configured on the server.")

    user_prompt = f"""
REJECTION LETTER CONTENT:
---
{rejection_text[:8000]}
---

Analyze this Indian health insurance rejection letter and respond with the JSON structure specified.
"""

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
            ),
        )

        raw = response.text.strip()

        # Strip markdown code fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        result = json.loads(raw)

        # Validate required keys
        required = ["success_score", "rejection_reason", "grounds_for_appeal",
                    "recommended_strategy", "appeal_letter"]
        for key in required:
            if key not in result:
                raise ValueError(f"Missing key: {key}")

        return result

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=502, detail=f"AI returned invalid JSON: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/health")
def health():
    return {"status": "ok", "service": "ClaimSense API"}
