#!/bin/bash

# Local testing script
# Main workflow has been migrated to GitHub Actions (.github/workflows/run.yml)

# Environment variables check and prompt
echo "=== Local Debug Environment Check ==="
if [ -z "$TOKEN_GITHUB" ]; then
    echo "⚠️  Warning: TOKEN_GITHUB not set"
    echo "May limit GitHub related functionalities"
fi
    echo "✅ TOKEN_GITHUB is set"

# Check required environment variables
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY not set"
    echo "📝 For complete local debugging, please set the following environment variables:"
    echo ""
    echo "🔑 Required variables:"
    echo "   export OPENAI_API_KEY=\"your-api-key-here\""
    echo ""
    echo "🔧 Optional variables:"
    echo "   export OPENAI_BASE_URL=\"https://api.openai.com/v1\"  # API base URL"
    echo "   export LANGUAGE=\"Chinese\"                           # Language setting"
    echo "   export CATEGORIES=\"cs.CV, cs.CL\"                    # Categories of interest"
    echo "   export MODEL_NAME=\"gpt-4o-mini\"                     # Model name"
    echo ""
    echo "💡 After setting, rerun this script for complete testing"
    echo "🚀 Or continue with partial workflow (crawl + dedup check)"
    echo ""
    read -p "Continue with partial workflow? (y/N): " continue_partial
    if [[ ! $continue_partial =~ ^[Yy]$ ]]; then
        echo "Exiting script"
        exit 0
    fi
    PARTIAL_MODE=true
else
    echo "✅ OPENAI_API_KEY is set"
    PARTIAL_MODE=false

    # Set default values
    export LANGUAGE="${LANGUAGE:-Chinese}"
    export CATEGORIES="${CATEGORIES:-cs.CV, cs.CL}"
    export MODEL_NAME="${MODEL_NAME:-gpt-4o-mini}"
    export OPENAI_BASE_URL="${OPENAI_BASE_URL:-https://api.openai.com/v1}"

    echo "🔧 Current configuration:"
    echo "   LANGUAGE: $LANGUAGE"
    echo "   CATEGORIES: $CATEGORIES"
    echo "   MODEL_NAME: $MODEL_NAME"
    echo "   OPENAI_BASE_URL: $OPENAI_BASE_URL"
fi

echo ""
echo "=== Starting Local Debug Workflow ==="

# Get current date
today=`date -u "+%Y-%m-%d"`

echo "Local test: Crawling $today arXiv papers..."

# Step 1: Crawl data
echo "Step 1: Starting crawl..."

# Check if today's file exists, delete if found
if [ -f "data/${today}.jsonl" ]; then
    echo "🗑️ Found existing today's file, deleting for fresh start..."
    rm "data/${today}.jsonl"
    echo "✅ Deleted existing file: data/${today}.jsonl"
else
    echo "📝 Today's file doesn't exist, ready to create new one..."
fi

cd daily_arxiv
scrapy crawl arxiv -o ../data/${today}.jsonl

if [ ! -f "../data/${today}.jsonl" ]; then
    echo "Crawling failed, no data file generated"
    exit 1
fi

# Step 2: Check duplicates
echo "Step 2: Performing intelligent deduplication check..."
python daily_arxiv/check_stats.py
dedup_exit_code=$?

case $dedup_exit_code in
    0)
        # check_stats.py already output success info, continue processing
        ;;
    1)
        # check_stats.py already output no new content info, stop processing
        exit 1
        ;;
    2)
        # check_stats.py already output error info, stop processing
        exit 2
        ;;
    *)
        echo "❌ Unknown exit code, stopping..."
        exit 1
        ;;
esac

cd ..

# Step 3: AI processing
if [ "$PARTIAL_MODE" = "false" ]; then
    echo "Step 3: AI enhancement processing..."
    cd ai
    python enhance.py --data ../data/${today}.jsonl

    if [ $? -ne 0 ]; then
        echo "❌ AI processing failed"
        exit 1
    fi
    echo "✅ AI enhancement processing completed"
    cd ..
else
    echo "⏭️  Skipping AI processing (partial mode)"
fi

# Step 4: Convert to Markdown
echo "Step 4: Converting to Markdown..."
cd to_md

if [ "$PARTIAL_MODE" = "false" ] && [ -f "../data/${today}_AI_enhanced_${LANGUAGE}.jsonl" ]; then
    echo "📄 Using AI enhanced data for conversion..."
    python convert.py --data ../data/${today}_AI_enhanced_${LANGUAGE}.jsonl

    if [ $? -ne 0 ]; then
        echo "❌ Markdown conversion failed"
        exit 1
    fi
    echo "✅ AI enhanced Markdown conversion completed"

else
    if [ "$PARTIAL_MODE" = "true" ]; then
        echo "⏭️  Skipping Markdown conversion (partial mode, requires AI enhanced data)"
    else
        echo "❌ Error: AI enhanced file not found"
        echo "AI file: ../data/${today}_AI_enhanced_${LANGUAGE}.jsonl"
        exit 1
    fi
fi

cd ..

# Step 5: Update file list
echo "Step 5: Updating file list..."
ls data/*.jsonl | sed 's|data/||' > assets/file-list.txt
echo "✅ File list updated"

# Completion summary
echo ""
echo "=== Local Debug Completed ==="
if [ "$PARTIAL_MODE" = "false" ]; then
    echo "🎉 Complete workflow finished:"
    echo "   ✅ Data crawling"
    echo "   ✅ Smart duplicate check"
    echo "   ✅ AI enhancement"
    echo "   ✅ Markdown conversion"
    echo "   ✅ File list update"
else
    echo "🔄 Partial workflow finished:"
    echo "   ✅ Data crawling"
    echo "   ✅ Smart duplicate check"
    echo "   ⏭️  Skipped AI enhancement and Markdown conversion"
    echo "   ✅ File list update"
    echo ""
    echo "💡 Tip: Set OPENAI_API_KEY to enable full functionality"
fi