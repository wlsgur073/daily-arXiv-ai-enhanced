---
name: daily-arxiv-ai-enhanced
version: 0.1
description: Fetch paper JSON data from the daily-arxiv-ai-enhanced project via URL requests
---

# arXiv Paper Data API

## Trigger Condition
The user wants to fetch data from the daily-arXiv-ai-enhanced project

## Description
Fetch arXiv paper data in JSON format via URL parameters

## Base Repository URL
https://dw-dengwei.github.io/daily-arXiv-ai-enhanced/

## URL Parameters

| Parameter | Description | Example |
|------|------|------|
| `category` | arXiv category | `cs.CV`, `cs.AI`, etc. |
| `author` | Author name | `Smith` |
| `keywords` | Keywords, comma-separated | `vision,learning` |

## Example
```
bash scripts/fetch.sh "https://dw-dengwei.github.io/daily-arXiv-ai-enhanced/?category=cs.CV&author=Smith&keywords=deep"
```
This uses the `fetch.sh` script to send the request and process the response data. The script relies on a Node.js and puppeteer environment, and will install them automatically if they are not present. You cannot wget or curl this URL directly, because it needs to execute JavaScript to generate the final JSON response.

## Filtering Logic

```
category AND (keywords OR author)
```

- category: hard filter, only returns the specified category
- keywords: searched in the title and abstract
- author: searched in the author field
- keywords and author have an "OR" relationship

## JSON Response Structure

```json
{
  "category": "cs.CV",
  "author": "Smith",
  "keywords": ["deep"],
  "count": 10,
  "papers": [
    {
      "id": "2401.00001",
      "title": "title",
      "authors": "author1, author2",
      "categories": ["cs.CV"],
      "summary": "tldr",
      "date": "2024-01-01",
      "url": "https://arxiv.org/abs/2401.00001"
    }
  ]
}
```