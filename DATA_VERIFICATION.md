# Yojana Saathi — Government Scheme Data Verification Checklist

This document serves as the formal verification tracker for all schemes, eligibility thresholds, required documents, and service center locations configured in `data/schemes.json`, `data/documents.json`, and `data/centers.json`.

> [!IMPORTANT]
> **Data Integrity Policy**: All initial data in Yojana Saathi is seeded as draft (`"verified": false`). No scheme condition or benefit amount may be treated as legally verified until checked against official government gazettes or portals (e.g. `myscheme.gov.in`, `nsap.nic.in`, `pmjay.gov.in`, `pmayg.nic.in`).

---

## 1. Scheme Eligibility & Threshold Verification

| Scheme ID | Scheme Name | Current Draft Conditions | Official Verification Source | Verified By / Date | Status |
|---|---|---|---|---|---|
| `widow_pension` | Indira Gandhi National Widow Pension Scheme (NSAP) | 1. `marital_status == "widowed"`<br>2. `age >= 40`<br>3. `income_category in ["BPL", "low"]` | [NSAP Portal](https://nsap.nic.in) / [myScheme Widow Pension](https://www.myscheme.gov.in/schemes/ignwps) | `[                   ]` | ⚠️ Unverified (`verified: false`) |
| `old_age_pension` | Indira Gandhi National Old Age Pension Scheme (NSAP) | 1. `age >= 60`<br>2. `income_category in ["BPL", "low"]` | [NSAP Guidelines](https://nsap.nic.in) / [myScheme IGNOAPS](https://www.myscheme.gov.in/schemes/ignoaps) | `[                   ]` | ⚠️ Unverified (`verified: false`) |
| `pmjay` | Ayushman Bharat - PM Jan Arogya Yojana | 1. `income_category in ["BPL", "low"]` *(SECC deprivation criteria / Ration card)* | [PMJAY Official](https://pmjay.gov.in) / [National Health Authority](https://nha.gov.in) | `[                   ]` | ⚠️ Unverified (`verified: false`) |
| `nfsa_ration` | National Food Security Act (NFSA) Ration Card | 1. `income_category in ["BPL", "low"]` *(Priority Household / AAY criteria)* | [NFSA Portal](https://nfsa.gov.in) / [Food & Consumer Protection Dept Bihar](http://epds.bihar.gov.in) | `[                   ]` | ⚠️ Unverified (`verified: false`) |
| `ujjwala` | Pradhan Mantri Ujjwala Yojana 2.0 (LPG) | 1. `gender == "female"`<br>2. `age >= 18`<br>3. `income_category in ["BPL", "low"]` | [PMUY Official](https://www.pmuy.gov.in) / [Ministry of Petroleum & Natural Gas](https://mopng.gov.in) | `[                   ]` | ⚠️ Unverified (`verified: false`) |
| `pmay_g` | Pradhan Mantri Awas Yojana - Gramin | 1. `has_pucca_house == false`<br>2. `income_category in ["BPL", "low"]` | [PMAY-G Portal](https://pmayg.nic.in) / [Ministry of Rural Development](https://rural.nic.in) | `[                   ]` | ⚠️ Unverified (`verified: false`) |

---

## 2. Required Documents Checklist Verification

| Document ID | Hindi Name | English Name | Issuing Authority / Guidance | Verified Where to Get | Verified By / Date |
|---|---|---|---|---|---|
| `aadhaar` | आधार कार्ड | Aadhaar Card | UIDAI (Unique Identification Authority of India) | नज़दीकी आधार केंद्र या CSC | `[                   ]` |
| `bank_passbook` | बैंक पासबुक | Bank Passbook | Any Scheduled Commercial / Rural / Postal Bank | अपनी बैंक शाखा से | `[                   ]` |
| `death_certificate` | पति का मृत्यु प्रमाणपत्र | Husband's Death Certificate | Registrar of Births and Deaths / Gram Panchayat / Municipality | ग्राम पंचायत या नगर निकाय कार्यालय | `[                   ]` |
| `income_certificate` | आय प्रमाणपत्र | Income Certificate | Revenue Department / Circle Office (RTPS Bihar) | प्रखंड/अंचल कार्यालय या CSC | `[                   ]` |
| `bpl_card` | BPL / राशन कार्ड | BPL / Ration Card | Food & Civil Supplies Department | प्रखंड आपूर्ति कार्यालय | `[                   ]` |
| `photo` | पासपोर्ट साइज़ फोटो | Passport Size Photo | Self-procured | नज़दीकी फोटो की दुकान | `[                   ]` |
| `age_proof` | उम्र का प्रमाण | Age Proof Document | Birth Cert, School Leaving Cert, or Medical Officer Cert | आधार, स्कूल प्रमाणपत्र या जन्म प्रमाणपत्र | `[                   ]` |
| `residence_certificate` | निवास प्रमाणपत्र | Residence Certificate | Sub-Divisional / Circle Officer (RTPS Bihar) | प्रखंड कार्यालय या CSC | `[                   ]` |
| `house_proof` | घर की स्थिति का प्रमाण | Proof of Housing Condition | Gram Panchayat / Awas Sahayak verification | ग्राम पंचायत | `[                   ]` |

---

## 3. Physical Service Center Verification (Gaya & Patna Samples)

All current addresses in `data/centers.json` are marked as sample placeholders (`(नमूना)`):

| Center ID | Center Name | Type | District | Address in Seed Data | Actual Verified Address & PIN | Verified By / Date |
|---|---|---|---|---|---|---|
| `csc_gaya_1` | CSC बोधगया (नमूना) | CSC | Gaya | पता जोड़ना बाकी है | `[                                  ]` | `[                   ]` |
| `csc_gaya_2` | CSC मानपुर (नमूना) | CSC | Gaya | पता जोड़ना बाकी है | `[                                  ]` | `[                   ]` |
| `csc_gaya_3` | CSC शेरघाटी (नमूना) | CSC | Gaya | पता जोड़ना बाकी है | `[                                  ]` | `[                   ]` |
| `block_gaya_1` | प्रखंड कार्यालय गया सदर (नमूना) | Block Office | Gaya | पता जोड़ना बाकी है | `[                                  ]` | `[                   ]` |
| `block_gaya_2` | प्रखंड कार्यालय बेलागंज (नमूना) | Block Office | Gaya | पता जोड़ना बाकी है | `[                                  ]` | `[                   ]` |
| `csc_patna_1` | CSC दानापुर (नमूना) | CSC | Patna | पता जोड़ना बाकी है | `[                                  ]` | `[                   ]` |
| `block_patna_1` | प्रखंड कार्यालय पटना सदर (नमूना) | Block Office | Patna | पता जोड़ना बाकी है | `[                                  ]` | `[                   ]` |
| `csc_muzaffarpur_1` | CSC मुजफ्फरपुर सदर (नमूना) | CSC | Muzaffarpur | पता जोड़ना बाकी है | `[                                  ]` | `[                   ]` |
| `block_muzaffarpur_1` | प्रखंड कार्यालय मुजफ्फरपुर (नमूना) | Block Office | Muzaffarpur | पता जोड़ना बाकी है | `[                                  ]` | `[                   ]` |
| `csc_bhagalpur_1` | CSC भागलपुर सदर (नमूना) | CSC | Bhagalpur | पता जोड़ना बाकी है | `[                                  ]` | `[                   ]` |
| `block_bhagalpur_1` | प्रखंड कार्यालय भागलपुर (नमूना) | Block Office | Bhagalpur | पता जोड़ना बाकी है | `[                                  ]` | `[                   ]` |

---

## 4. Steps to Promote Draft Data to Verified Status

1. **Verify Official Gazette / Notification**:
   - Locate the scheme's active guidelines on official ministry portals (`.gov.in` / `.nic.in`).
   - Check if state amendments apply (e.g. Bihar Social Security Pension rules).
2. **Review Age & Income Cutoffs**:
   - Validate numerical cutoffs (e.g. widow pension age threshold, senior citizen age).
3. **Inspect Document Prerequisites**:
   - Confirm whether digital ration cards or e-Aadhaar are accepted.
4. **Update `data/schemes.json`**:
   - Change `"verified": false` to `"verified": true`.
   - Update `apply_url` to direct scheme portal if changed.
5. **Sign Off**:
   - Record the reviewer name, date, and citation link in this document.
