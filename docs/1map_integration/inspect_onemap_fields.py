#!/usr/bin/env python3
"""
Inspect 1Map API response fields to understand available data structure.
Outputs all field names from a sample record.
"""

import os
import sys
import json
import asyncio
import httpx
from dotenv import load_dotenv

load_dotenv(override=True)

# Debug: print loaded vars
print(f"Loaded ONEMAP_EMAIL: {os.getenv('ONEMAP_EMAIL')}")
print(f"Loaded ONEMAP_PASSWORD: {'*' * len(os.getenv('ONEMAP_PASSWORD', '')) if os.getenv('ONEMAP_PASSWORD') else 'NOT SET'}")


async def inspect_fields():
    """Fetch a sample record and print all available fields."""

    email = os.getenv("ONEMAP_EMAIL", "hein@velocityfibre.co.za")
    password = os.getenv("ONEMAP_PASSWORD")

    if not password:
        print("ERROR: ONEMAP_PASSWORD not set")
        sys.exit(1)

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        # Authenticate
        print("Authenticating...")
        response = await client.post(
            "https://www.1map.co.za/login",
            data={"email": email, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )

        if "connect.sid" not in response.cookies:
            print(f"Authentication failed - Status: {response.status_code}")
            print(f"Response cookies: {response.cookies}")
            print(f"Response text: {response.text[:500]}")
            sys.exit(1)

        print("Authenticated successfully")

        # Fetch a few records from Lawley
        print("\nFetching sample records from Lawley...")
        response = await client.post(
            "https://www.1map.co.za/api/apps/app/getattributes",
            data={
                "ungeocoded": "false",
                "left": "0", "bottom": "0", "right": "0", "top": "0",
                "selfilter": "",
                "action": "get",
                "email": email,
                "layerid": "5121",  # Fibertime Installations
                "sort": "prop_id",
                "templateExpression": "",
                "q": "lawley",
                "page": "1",
                "start": "0",
                "limit": "5"
            },
            headers={"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"}
        )

        result = response.json()

        if not result.get("success"):
            print(f"API request failed: {result}")
            sys.exit(1)

        records = result.get("result", [])
        print(f"\nFound {len(records)} sample records")

        if records:
            # Print all field names from first record
            first_record = records[0]

            print("\n" + "="*80)
            print("ALL AVAILABLE FIELDS IN 1MAP API RESPONSE:")
            print("="*80)

            # Sort fields alphabetically and categorize
            fields = sorted(first_record.keys())

            # Categorize fields
            photo_fields = [f for f in fields if f.startswith('ph_')]
            location_fields = [f for f in fields if f in ['latitude', 'longitude', 'address', 'geom', 'x', 'y']]
            id_fields = [f for f in fields if 'id' in f.lower() or f in ['drp', 'pole', 'prop_id']]
            other_fields = [f for f in fields if f not in photo_fields + location_fields + id_fields]

            print("\n--- IDENTIFIERS ---")
            for f in id_fields:
                print(f"  {f}: {repr(first_record[f])[:80]}")

            print("\n--- LOCATION FIELDS ---")
            for f in location_fields:
                val = first_record.get(f)
                print(f"  {f}: {repr(val)[:80]}")

            print("\n--- PHOTO FIELDS ---")
            for f in photo_fields:
                val = first_record.get(f)
                if val:
                    print(f"  {f}: {repr(val)[:60]}...")

            print("\n--- OTHER FIELDS (potential section/PON) ---")
            for f in other_fields:
                val = first_record.get(f)
                print(f"  {f}: {repr(val)[:80]}")

            # Save full record to JSON for reference
            output_file = "onemap_sample_record.json"
            with open(output_file, 'w') as f:
                json.dump(records, f, indent=2, default=str)
            print(f"\n\nFull sample records saved to: {output_file}")

            # Look specifically for section/zone/pon fields
            print("\n" + "="*80)
            print("SEARCHING FOR SECTION/PON RELATED FIELDS:")
            print("="*80)
            section_keywords = ['section', 'zone', 'area', 'pon', 'splitter', 'fsp', 'fdp', 'fcp']
            for f in fields:
                f_lower = f.lower()
                for keyword in section_keywords:
                    if keyword in f_lower:
                        print(f"  FOUND: {f} = {repr(first_record[f])}")


if __name__ == "__main__":
    asyncio.run(inspect_fields())
