// Test Fireflies API directly
require('dotenv').config({ path: '.env.local' });

const FIREFLIES_API_URL = 'https://api.fireflies.ai/graphql';
const apiKey = process.env.FIREFLIES_API_KEY;

const query = `
  query {
    transcripts {
      id
      title
      date
      duration
      transcript_url
      summary {
        keywords
        action_items
        outline
      }
      meeting_attendees {
        name
        email
        displayName
      }
    }
  }
`;

async function test() {
  console.log('Testing Fireflies API...');
  console.log('API Key:', apiKey?.substring(0, 10) + '...');

  const response = await fetch(FIREFLIES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ query }),
  });

  console.log('Status:', response.status, response.statusText);
  const data = await response.json();

  if (data.errors) {
    console.error('GraphQL Errors:', JSON.stringify(data.errors, null, 2));
  } else {
    console.log('Success! Got', data.data.transcripts.length, 'meetings');
    console.log('First meeting:', JSON.stringify(data.data.transcripts[0], null, 2));
  }
}

test().catch(console.error);
