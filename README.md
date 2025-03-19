# Excel Model Auditor

A service for auditing Excel models using AI to identify issues, risks, and areas for improvement.

## Overview

This service provides a complete workflow to:
1. Upload an Excel file
2. Extract detailed information from the Excel file's structure
3. Send the extracted information to an LLM (OpenAI's o3-mini model)
4. Get back a comprehensive audit report

## Key Features

- **Deep Excel Analysis**: Extracts formulas, data validations, conditional formats, charts, and more
- **OpenXML Parsing**: Goes beyond surface-level analysis to examine the internal structure
- **AI-Powered Auditing**: Uses OpenAI's models to identify issues and risks
- **Detailed Reports**: Provides risk assessments, issue identification, and recommendations

## Installation

### Prerequisites
- Python 3.8+
- Flask
- OpenAI API key

### Setup

1. Clone the repository:
```bash
git clone [repository-url]
cd audit-my-model
```

2. Install the required packages:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
export OPENAI_API_KEY="your-openai-api-key"
export UPLOAD_FOLDER="/path/to/upload/folder"  # Optional
```

4. Start the Flask application:
```bash
python backend/excel_app.py
```

## API Usage

### Upload and Analyze Excel File

**Endpoint:** `POST /api/excel/upload`

**Form Data:**
- `file`: The Excel file to analyze (required)
- `model`: OpenAI model to use (default: "o3-mini")
- `use_tools`: Whether to use structured function calling (default: "true")

**Example Request:**
```bash
curl -X POST -F "file=@/path/to/your/file.xlsx" -F "model=o3-mini" -F "use_tools=true" http://localhost:5000/api/excel/upload
```

**Example Response:**
```json
{
  "success": true,
  "file_info": {
    "filename": "financial_model.xlsx",
    "sheet_count": 3,
    "sheets": ["Summary", "Calculations", "Data"]
  },
  "llm_analysis": {
    "success": true,
    "analysis": {
      "summary": "This Excel model contains several high-risk issues...",
      "risk_level": "medium",
      "issues": [
        {
          "type": "formula",
          "location": "Calculations!B15",
          "description": "Circular reference detected",
          "risk_level": "high",
          "recommendation": "Restructure the formula to avoid circular references"
        },
        ...
      ],
      "recommendations": [
        "Add data validation to input cells",
        "Implement error handling in critical formulas",
        ...
      ]
    },
    "model": "o3-mini",
    "tokens": {
      "prompt_tokens": 2543,
      "completion_tokens": 1205,
      "total_tokens": 3748
    }
  }
}
```

### Analyze Existing File

**Endpoint:** `POST /api/excel/analyze`

**Request Body:**
```json
{
  "file_path": "/path/to/server/file.xlsx",
  "model": "o3-mini",
  "use_tools": true
}
```

**Example Request:**
```bash
curl -X POST -H "Content-Type: application/json" -d '{"file_path": "/tmp/uploaded/model.xlsx"}' http://localhost:5000/api/excel/analyze
```

## Architecture

The system consists of several components:

1. **Excel Parser**: Extracts detailed information from Excel files
   - Uses openpyxl for high-level parsing
   - Directly analyzes OpenXML structure for deeper insights

2. **LLM Service**: Interfaces with OpenAI's API
   - Supports both free-form and structured (function calling) responses
   - Configurable model selection

3. **Excel Audit Processor**: Orchestrates the workflow
   - Manages file upload handling
   - Coordinates parsing and LLM analysis
   - Provides unified response

4. **Flask API**: Exposes endpoints for client interaction
   - File upload handling
   - Response formatting

## License

[MIT License](LICENSE)

## Contact

For questions or support, please contact the project maintainers.

## Debugging

The application includes comprehensive logging for debugging purposes. These logs can be viewed in:

### Frontend Debugging

1. **Browser DevTools (F12 in Chrome)**
   - All frontend API calls and progress events are logged with timestamps
   - Look for messages prefixed with `[HH:MM:SS.mmm] 🚀 FRONTEND`
   - The Upload component has detailed logging for all steps: file selection, upload progress, and analysis status

2. **Status Polling**
   - The frontend polls the backend for analysis status every 5 seconds
   - Progress is reported to the user through the UI
   - Full debugging information is available in the console

### Backend Debugging

1. **Server Logs**
   - All backend operations are logged with timestamps
   - Excel API logs are prefixed with `[HH:MM:SS.mmm] 🔄 BACKEND EXCEL API`
   - LLM API logs are prefixed with `[HH:MM:SS.mmm] 🔍 LLM API`

2. **API Endpoints**
   - `/api/excel/analyze` - Performs Excel analysis using the LLM
   - `/api/openai/chat` - Direct access to OpenAI chat completion
   - `/api/upload` - Handles file uploads

### Troubleshooting Common Issues

1. **File Upload Issues**
   - Check frontend console for upload progress logs
   - Verify authentication token is being passed correctly
   - Check backend storage access permissions

2. **Analysis Issues**
   - Check LLM API logs for request/response details
   - Verify OpenAI API key is correctly set in `.env.local`
   - Look for parsing errors in Excel data extraction

3. **Database Updates**
   - Use the admin interface to check audit record status
   - Verify Supabase connection and permissions
