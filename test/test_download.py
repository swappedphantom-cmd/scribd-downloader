"""Unit tests for the pure helpers in scribd_dl.urls.

Run with:  python3 -m unittest discover -s test
These cover only the parsing/filename helpers (no network or browser).
"""

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scribd_dl.urls import extract_doc_id, title_from_slug, safe_filename


class ExtractDocId(unittest.TestCase):
    def test_supported_shapes(self):
        self.assertEqual(
            extract_doc_id("https://www.scribd.com/document/317428820/title"),
            "317428820",
        )
        self.assertEqual(extract_doc_id("https://scribd.com/doc/12345"), "12345")
        self.assertEqual(extract_doc_id("https://www.scribd.com/read/555/x"), "555")
        self.assertEqual(
            extract_doc_id("https://www.scribd.com/embeds/999/content"), "999"
        )

    def test_no_match(self):
        self.assertIsNone(extract_doc_id("https://www.scribd.com/search?q=foo"))
        self.assertIsNone(extract_doc_id("garbage"))


class TitleFromSlug(unittest.TestCase):
    def test_humanises_slug(self):
        self.assertEqual(
            title_from_slug("https://www.scribd.com/document/123/My-Great-Doc"),
            "My Great Doc",
        )

    def test_drops_extension(self):
        self.assertEqual(
            title_from_slug("https://www.scribd.com/document/123/report.pdf"),
            "report",
        )

    def test_rejects_placeholder_slugs(self):
        self.assertIsNone(title_from_slug("https://www.scribd.com/document/123/test"))
        self.assertIsNone(title_from_slug("https://www.scribd.com/document/123"))


class SafeFilename(unittest.TestCase):
    def test_replaces_unsafe_chars(self):
        self.assertEqual(safe_filename('a/b:c*?"<>|'), "a_b_c______")

    def test_falls_back_when_empty(self):
        self.assertEqual(safe_filename(""), "Scribd_Document")

    def test_truncates_to_200(self):
        self.assertEqual(len(safe_filename("x" * 300)), 200)


if __name__ == "__main__":
    unittest.main()
