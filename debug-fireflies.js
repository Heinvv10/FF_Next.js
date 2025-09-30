const { request, gql } = require('graphql-request');

const API_URL = 'https://api.fireflies.ai/graphql';
const API_KEY = process.env.FIREFLIES_API_KEY;

async function debugFirefliesMeetings() {
  try {
    const query = gql`
      query GetTranscripts {
        transcripts(limit: 200, order: "date", order_direction: "desc") {
          id
          title
          date
          duration
          participants
          transcript_url
          summary {
            overview
            bullet_gist
          }
        }
      }
    `;

    console.log('Fetching Fireflies meetings...');
    const data = await request(
      API_URL,
      query,
      {},
      { Authorization: `Bearer ${API_KEY}` }
    );

    console.log(`Found ${data.transcripts.length} meetings`);

    // Show the most recent 10 meetings
    const sorted = data.transcripts.sort((a, b) => b.date - a.date);

    console.log('\nMost recent 10 meetings:');
    sorted.slice(0, 10).forEach((meeting, i) => {
      const date = new Date(meeting.date);
      console.log(`${i+1}. ${meeting.title}`);
      console.log(`   Date: ${date.toISOString()}`);
      console.log(`   Local: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
      console.log(`   Duration: ${Math.floor(meeting.duration / 60)} minutes`);
      console.log(`   Participants: ${meeting.participants?.length || 0}`);
      console.log('');
    });

    // Check what's the latest date
    const latestDate = new Date(sorted[0]?.date);
    const today = new Date();
    const daysDiff = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));

    console.log(`Most recent meeting: ${latestDate.toISOString()}`);
    console.log(`Days from today: ${daysDiff}`);
    console.log(`Today: ${today.toISOString()}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

debugFirefliesMeetings();