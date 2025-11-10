// WhatsApp Bridge Updates for Group Feedback Feature
// This file contains the Go code modifications needed for the WhatsApp bridge
// Location: /opt/velo-test-monitor/services/whatsapp-bridge/main.go

// ============================================================================
// PART 1: Update the INSERT statement to include submitted_by field
// ============================================================================

// FIND THIS (around line 1165-1175):
/*
INSERT INTO qa_photo_reviews (
  drop_number, user_name, project, review_date, comment
) VALUES (
  $1, $2, $3, $4, $5
)
*/

// REPLACE WITH:
/*
INSERT INTO qa_photo_reviews (
  drop_number, user_name, project, review_date, comment, submitted_by
) VALUES (
  $1, $2, $3, $4, $5, $6
)
*/

// AND UPDATE THE EXEC CALL TO INCLUDE SENDER:
// FIND THIS:
/*
_, err = tx.Exec(ctx, query,
	dropNumber,
	userName,
	projectName,
	reviewDate,
	comment,
)
*/

// REPLACE WITH (add evt.Info.Sender.String() as $6):
/*
_, err = tx.Exec(ctx, query,
	dropNumber,
	userName,
	projectName,
	reviewDate,
	comment,
	evt.Info.Sender.String(),  // Add sender JID (e.g., "27640412391@s.whatsapp.net")
)
*/

// ============================================================================
// PART 2: Add HTTP Server for Send Message API
// ============================================================================

// ADD THIS NEW FUNCTION (after the main message handler):

/*
import (
	"net/http"
	"encoding/json"
	"io/ioutil"
)

// SendMessageRequest represents the API request
type SendMessageRequest struct {
	GroupJID    string `json:"group_jid"`    // e.g., "120363421664266245@g.us"
	RecipientJID string `json:"recipient_jid"` // e.g., "27640412391@s.whatsapp.net"
	Message     string `json:"message"`       // The feedback message
}

// SendMessageResponse represents the API response
type SendMessageResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

// startHTTPServer starts an HTTP server for sending messages
func startHTTPServer() {
	http.HandleFunc("/send-message", handleSendMessage)

	log.Println("🌐 Starting HTTP server on port 8080...")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("Failed to start HTTP server: %v", err)
	}
}

// handleSendMessage handles POST requests to send WhatsApp messages
func handleSendMessage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Only allow POST
	if r.Method != http.MethodPost {
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   "Method not allowed. Use POST",
		})
		return
	}

	// Parse request body
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   "Failed to read request body",
		})
		return
	}

	var req SendMessageRequest
	if err := json.Unmarshal(body, &req); err != nil {
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   "Invalid JSON",
		})
		return
	}

	// Validate required fields
	if req.GroupJID == "" || req.RecipientJID == "" || req.Message == "" {
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   "Missing required fields: group_jid, recipient_jid, message",
		})
		return
	}

	// Format message with mention
	// WhatsApp mention format: @27640412391 message text
	mentionedJID, err := types.ParseJID(req.RecipientJID)
	if err != nil {
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid recipient JID: %v", err),
		})
		return
	}

	groupJID, err := types.ParseJID(req.GroupJID)
	if err != nil {
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid group JID: %v", err),
		})
		return
	}

	// Create message with mention
	msg := &waProto.Message{
		ExtendedTextMessage: &waProto.ExtendedTextMessage{
			Text: proto.String(fmt.Sprintf("@%s %s", mentionedJID.User, req.Message)),
			ContextInfo: &waProto.ContextInfo{
				MentionedJid: []string{req.RecipientJID},
			},
		},
	}

	// Send message
	_, err = cli.SendMessage(context.Background(), groupJID, msg)
	if err != nil {
		log.Printf("❌ Failed to send message: %v", err)
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to send message: %v", err),
		})
		return
	}

	log.Printf("✅ Sent feedback to %s in group %s", req.RecipientJID, req.GroupJID)

	json.NewEncoder(w).Encode(SendMessageResponse{
		Success: true,
		Message: "Message sent successfully",
	})
}
*/

// ============================================================================
// PART 3: Start HTTP Server in main()
// ============================================================================

// ADD THIS TO main() FUNCTION (after WhatsApp client connects):
/*
// Start HTTP server in a goroutine
go startHTTPServer()
*/

// ============================================================================
// DEPLOYMENT INSTRUCTIONS
// ============================================================================
/*
1. SSH to VPS:
   ssh root@72.60.17.245

2. Backup current bridge:
   cp /opt/velo-test-monitor/services/whatsapp-bridge/main.go \
      /opt/velo-test-monitor/services/whatsapp-bridge/main.go.backup.feedback

3. Apply changes to main.go (use nano or vim)

4. Recompile:
   cd /opt/velo-test-monitor/services/whatsapp-bridge
   /usr/local/go/bin/go build -o whatsapp-bridge-new main.go

5. Stop old bridge:
   pkill whatsapp-bridge

6. Replace binary:
   mv whatsapp-bridge whatsapp-bridge.old
   mv whatsapp-bridge-new whatsapp-bridge

7. Start new bridge:
   nohup ./whatsapp-bridge > /opt/velo-test-monitor/logs/whatsapp-bridge.log 2>&1 &

8. Verify:
   ps aux | grep whatsapp-bridge
   tail -f /opt/velo-test-monitor/logs/whatsapp-bridge.log
   # Should see: "🌐 Starting HTTP server on port 8080..."

9. Test send endpoint:
   curl -X POST http://localhost:8080/send-message \
     -H "Content-Type: application/json" \
     -d '{
       "group_jid": "120363421664266245@g.us",
       "recipient_jid": "27640412391@s.whatsapp.net",
       "message": "Test message"
     }'
*/
