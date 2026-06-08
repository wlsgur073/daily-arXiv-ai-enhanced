import scrapy
import os
import re


class ArxivSpider(scrapy.Spider):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        categories = os.environ.get("CATEGORIES", "cs.CV")
        categories = categories.split(",")
        # Save the target category list for later validation
        self.target_categories = set(map(str.strip, categories))
        self.start_urls = [
            f"https://arxiv.org/list/{cat}/new" for cat in self.target_categories
        ]  # Start URLs (latest papers in computer science fields)

    name = "arxiv"  # Spider name
    allowed_domains = ["arxiv.org"]  # Domains allowed to be crawled

    def parse(self, response):
        # Extract the information of each paper
        anchors = []
        for li in response.css("div[id=dlpage] ul li"):
            href = li.css("a::attr(href)").get()
            if href and "item" in href:
                anchors.append(int(href.split("item")[-1]))

        # Iterate over the detailed information of each paper
        for paper in response.css("dl dt"):
            paper_anchor = paper.css("a[name^='item']::attr(name)").get()
            if not paper_anchor:
                continue
                
            paper_id = int(paper_anchor.split("item")[-1])
            if anchors and paper_id >= anchors[-1]:
                continue

            # Get the paper ID
            abstract_link = paper.css("a[title='Abstract']::attr(href)").get()
            if not abstract_link:
                continue

            arxiv_id = abstract_link.split("/")[-1]

            # Get the corresponding paper description part (dd element)
            paper_dd = paper.xpath("following-sibling::dd[1]")
            if not paper_dd:
                continue

            # Extract paper category information - in the subjects part
            subjects_text = paper_dd.css(".list-subjects .primary-subject::text").get()
            if not subjects_text:
                # If the primary category is not found, try another way to get the categories
                subjects_text = paper_dd.css(".list-subjects::text").get()

            if subjects_text:
                # Parse the category information, usually formatted like "Computer Vision and Pattern Recognition (cs.CV)"
                # Extract the category codes inside the parentheses
                categories_in_paper = re.findall(r'\(([^)]+)\)', subjects_text)

                # Check whether the paper's categories intersect with the target categories
                paper_categories = set(categories_in_paper)
                if paper_categories.intersection(self.target_categories):
                    yield {
                        "id": arxiv_id,
                        "categories": list(paper_categories),  # Add category information for debugging
                    }
                    self.logger.info(f"Found paper {arxiv_id} with categories {paper_categories}")
                else:
                    self.logger.debug(f"Skipped paper {arxiv_id} with categories {paper_categories} (not in target {self.target_categories})")
            else:
                # If the category information cannot be obtained, log a warning but still return the paper (keep backward compatibility)
                self.logger.warning(f"Could not extract categories for paper {arxiv_id}, including anyway")
                yield {
                    "id": arxiv_id,
                    "categories": [],
                }
