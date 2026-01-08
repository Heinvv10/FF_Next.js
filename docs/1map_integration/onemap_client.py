#!/usr/bin/env python3
"""
1Map API Test Script
Tests session-based authentication and data retrieval from 1Map GIS API

Based on browser automation discovery:
- Authentication: Session cookies (connect.sid, csrfToken)
- Endpoint: POST /api/apps/app/getattributes
- Request format: URL-encoded form data
- Layer ID 5121: Fibertime Installations
"""

import os
import sys
import json
import asyncio
import httpx
from datetime import datetime
from typing import Optional, Dict, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class OneMapClient:
    """1Map GIS API Client with session-based authentication"""

    BASE_URL = "https://www.1map.co.za"

    def __init__(self, email: str, password: str):
        self.email = email
        self.password = password
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True
        )

    async def __aenter__(self):
        await self.authenticate()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.client.aclose()

    async def authenticate(self) -> bool:
        """Authenticate with 1Map using session-based login"""
        print(f"Authenticating with 1Map as {self.email}...")

        login_url = f"{self.BASE_URL}/login"

        try:
            # POST form data to login endpoint
            response = await self.client.post(
                login_url,
                data={
                    "email": self.email,
                    "password": self.password
                },
                headers={
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            )

            # Check if we got session cookies
            cookies = response.cookies
            has_session = "connect.sid" in cookies

            if has_session:
                print(f"Authentication successful! Session cookies obtained.")
                print(f"  Session ID: {cookies['connect.sid'][:20]}...")
                return True
            else:
                print(f"Authentication failed - no session cookie received")
                print(f"  Status: {response.status_code}")
                print(f"  Response: {response.text[:200]}")
                return False

        except Exception as e:
            print(f"Authentication failed: {e}")
            raise

    async def search_installations(
        self,
        query: str,
        layer_id: str = "5121",
        page: int = 1,
        limit: int = 50
    ) -> Dict:
        """
        Search for installations using the discovered API endpoint

        Args:
            query: Search query (DR number, site code, or project name)
            layer_id: Layer ID (5121 = Fibertime Installations, 5198 = Poles)
            page: Page number for pagination
            limit: Results per page (max 50)

        Returns:
            API response with installation records
        """
        print(f"\nSearching for: {query} (page {page}, limit {limit})")

        url = f"{self.BASE_URL}/api/apps/app/getattributes"

        # Calculate start index for pagination
        start = (page - 1) * limit

        # URL-encoded form data (matching captured request)
        data = {
            "ungeocoded": "false",
            "left": "0",
            "bottom": "0",
            "right": "0",
            "top": "0",
            "selfilter": "",
            "action": "get",
            "email": self.email,
            "layerid": layer_id,
            "sort": "prop_id",
            "templateExpression": "",
            "q": query,
            "page": str(page),
            "start": str(start),
            "limit": str(limit)
        }

        try:
            response = await self.client.post(
                url,
                data=data,
                headers={
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                }
            )

            response.raise_for_status()
            result = response.json()

            # Print summary
            if result.get("success"):
                total_pages = result.get("total_pages", 0)
                current_page = result.get("current_page", 0)
                results_count = len(result.get("result", []))

                print(f"Found {results_count} records (page {current_page}/{total_pages:.0f})")

            return result

        except Exception as e:
            print(f"Search failed: {e}")
            raise

    async def get_dr(self, dr_number: str) -> Optional[Dict]:
        """
        Get specific DR record

        Args:
            dr_number: DR number (e.g., "DR1734472")

        Returns:
            Installation record or None if not found
        """
        result = await self.search_installations(dr_number, limit=10)

        if result.get("success"):
            records = result.get("result", [])

            # Find exact match
            for record in records:
                if record.get("drp") == dr_number:
                    return record

            print(f"No exact match found for {dr_number}")
            if records:
                print(f"Found {len(records)} similar records")

        return None

    async def get_all_installations(
        self,
        query: str,
        layer_id: str = "5121",
        max_pages: Optional[int] = None
    ) -> List[Dict]:
        """
        Get all installations for a site/project (handles pagination)

        Args:
            query: Site code or project name (e.g., "lawley", "LAW")
            layer_id: Layer ID (default 5121 = Installations)
            max_pages: Maximum pages to fetch (None = all pages)

        Returns:
            List of all installation records
        """
        all_records = []
        page = 1

        print(f"\nFetching all installations for: {query}")

        while True:
            result = await self.search_installations(query, layer_id, page=page)

            if not result.get("success"):
                break

            records = result.get("result", [])
            all_records.extend(records)

            total_pages = result.get("total_pages", 0)

            # Check if we should continue
            if page >= total_pages:
                break

            if max_pages and page >= max_pages:
                print(f"Reached max_pages limit ({max_pages})")
                break

            page += 1

        print(f"Total records fetched: {len(all_records)}")
        return all_records

    def print_record(self, record: Dict) -> None:
        """Print formatted installation record"""
        print("\n" + "="*80)
        print("INSTALLATION RECORD")
        print("="*80)

        # Key fields
        print(f"\nDrop Number:     {record.get('drp', 'N/A')}")
        print(f"Pole Number:     {record.get('pole', 'N/A')}")
        print(f"Status:          {record.get('status', 'N/A')}")
        print(f"Site:            {record.get('site', 'N/A')}")

        # Location
        print(f"\nAddress:         {record.get('address', 'N/A')}")
        lat = record.get('latitude')
        lon = record.get('longitude')
        if lat and lon:
            print(f"GPS Coordinates: {lat}, {lon}")
            print(f"Google Maps:     https://maps.google.com/?q={lat},{lon}")

        # Metadata
        print(f"\nProperty ID:     {record.get('prop_id', 'N/A')}")
        print(f"Created:         {record.get('created', 'N/A')}")
        print(f"Modified:        {record.get('modified', 'N/A')}")

        print("="*80)


async def main():
    """Run API tests"""

    # Get credentials from environment
    email = os.getenv("ONEMAP_EMAIL", "hein@velocityfibre.co.za")
    password = os.getenv("ONEMAP_PASSWORD")

    if not password:
        print("ERROR: ONEMAP_PASSWORD environment variable not set")
        print("\nUsage:")
        print("  export ONEMAP_PASSWORD='your_password'")
        print("  python test_onemap_api.py")
        sys.exit(1)

    print("="*80)
    print("  1MAP API TEST - SESSION-BASED AUTHENTICATION")
    print("="*80)

    async with OneMapClient(email, password) as client:

        # Test 1: Search for specific DR
        print("\n" + "="*80)
        print("TEST 1: Search for specific DR")
        print("="*80)

        dr_record = await client.get_dr("DR1734472")

        if dr_record:
            client.print_record(dr_record)
        else:
            print("DR record not found")

        # Test 2: Search for site (first page only)
        print("\n" + "="*80)
        print("TEST 2: Search by site (Lawley - first page)")
        print("="*80)

        result = await client.search_installations("lawley", limit=10)

        if result.get("success"):
            records = result.get("result", [])
            print(f"\nShowing {len(records)} of {result.get('total_pages', 0) * 50:.0f} total records")

            for i, record in enumerate(records[:3], 1):
                print(f"\n--- Record {i} ---")
                print(f"DR: {record.get('drp')}")
                print(f"Pole: {record.get('pole')}")
                print(f"Address: {record.get('address', 'N/A')[:60]}...")
                print(f"GPS: {record.get('latitude')}, {record.get('longitude')}")

        # Test 3: Get all installations for a site (with limit)
        print("\n" + "="*80)
        print("TEST 3: Get all installations (max 2 pages)")
        print("="*80)

        all_records = await client.get_all_installations("lawley", max_pages=2)

        # Summary statistics
        print(f"\nSummary:")
        print(f"  Total records: {len(all_records)}")

        # Count unique DR numbers
        dr_numbers = set(r.get('drp') for r in all_records if r.get('drp'))
        print(f"  Unique DRs: {len(dr_numbers)}")

        # Count unique poles
        poles = set(r.get('pole') for r in all_records if r.get('pole'))
        print(f"  Unique poles: {len(poles)}")

        # Save to file
        output_file = f"onemap_lawley_sample_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w') as f:
            json.dump(all_records, f, indent=2)

        print(f"\nSample data saved to: {output_file}")


if __name__ == "__main__":
    asyncio.run(main())
