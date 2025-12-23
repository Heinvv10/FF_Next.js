package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	_ "github.com/mattn/go-sqlite3"
	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"
)

// Global WhatsApp client
var client *whatsmeow.Client

// SendMessageRequest represents the incoming HTTP request
type SendMessageRequest struct {
	GroupJID     string `json:"group_jid"`
	RecipientJID string `json:"recipient_jid"`
	Message      string `json:"message"`
}

// SendMessageResponse represents the HTTP response
type SendMessageResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	Error   string `json:"error,omitempty"`
}

func main() {
	// Set up logger
	logger := waLog.Stdout("Sender", "INFO", true)
	logger.Infof("🚀 WhatsApp Message Sender Service Starting...")

	// Connect to sender's own WhatsApp session (separate from bridge)
	dbLog := waLog.Stdout("Database", "WARN", true)
	storeContainer, err := sqlstore.New(context.Background(), "sqlite3", "file:/home/louis/whatsapp-sender/store/whatsapp.db?_foreign_keys=on", dbLog)
	if err != nil {
		logger.Errorf("Failed to connect to store: %v", err)
		os.Exit(1)
	}

	// Get the first device or create new one
	deviceStore, err := storeContainer.GetFirstDevice(context.Background())
	if err != nil {
		logger.Errorf("Failed to get device: %v", err)
		os.Exit(1)
	}

	// If no device exists, create a new one
	if deviceStore == nil {
		deviceStore = storeContainer.NewDevice()
		logger.Infof("📱 New device created - pairing required")
	}

	// Create WhatsApp client
	client = whatsmeow.NewClient(deviceStore, waLog.Stdout("Client", "WARN", true))

	// Connect to WhatsApp websocket first
	err = client.Connect()
	if err != nil {
		logger.Errorf("Failed to connect: %v", err)
		os.Exit(1)
	}

	// Check if device is logged in
	if client.Store.ID == nil {
		// Not logged in - need to pair
		logger.Infof("🔑 Device not logged in - generating pairing code...")

		// Request pairing code for phone number
		code, err := client.PairPhone(context.Background(), "+27711558396", true, whatsmeow.PairClientChrome, "Chrome (Linux)")
		if err != nil {
			logger.Errorf("Failed to generate pairing code: %v", err)
			os.Exit(1)
		}

		logger.Infof("========================================")
		logger.Infof("🔑 PAIRING CODE: %s", code)
		logger.Infof("========================================")
		logger.Infof("📱 On phone +27 71 155 8396:")
		logger.Infof("   1. Open WhatsApp")
		logger.Infof("   2. Go to Settings → Linked Devices")
		logger.Infof("   3. Tap 'Link a Device'")
		logger.Infof("   4. Tap 'Link with Phone Number Instead'")
		logger.Infof("   5. Enter code: %s", code)
		logger.Infof("========================================")

		// Wait for pairing to complete
		logger.Infof("⏳ Waiting for phone to be linked...")
	} else {
		logger.Infof("✅ Connected to WhatsApp!")
	}

	// Set up HTTP server
	http.HandleFunc("/send-message", handleSendMessage)
	http.HandleFunc("/health", handleHealth)

	// Start HTTP server on port 8081
	go func() {
		logger.Infof("🌐 HTTP Server listening on :8081")
		if err := http.ListenAndServe(":8081", nil); err != nil {
			logger.Errorf("HTTP server error: %v", err)
		}
	}()

	// Wait for interrupt signal
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c

	logger.Infof("Shutting down...")
	client.Disconnect()
}

// handleHealth is a simple health check endpoint
func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "ok",
		"service":   "whatsapp-sender",
		"connected": client.IsConnected(),
	})
}

// handleSendMessage sends a WhatsApp message with mention to a group
func handleSendMessage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Only allow POST
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   "Method not allowed. Use POST",
		})
		return
	}

	// Read request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   "Failed to read request body",
		})
		return
	}

	// Parse JSON
	var req SendMessageRequest
	if err := json.Unmarshal(body, &req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   "Invalid JSON",
		})
		return
	}

	// Validate required fields
	if req.GroupJID == "" || req.RecipientJID == "" || req.Message == "" {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   "Missing required fields: group_jid, recipient_jid, message",
		})
		return
	}

	// Parse JIDs
	groupJID, err := types.ParseJID(req.GroupJID)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid group_jid: %v", err),
		})
		return
	}

	recipientJID, err := types.ParseJID(req.RecipientJID)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   fmt.Sprintf("Invalid recipient_jid: %v", err),
		})
		return
	}

	// Create message with mention
	// Format: @27640412391 [message text]
	messageText := fmt.Sprintf("@%s %s", recipientJID.User, req.Message)

	msg := &waProto.Message{
		ExtendedTextMessage: &waProto.ExtendedTextMessage{
			Text: proto.String(messageText),
			ContextInfo: &waProto.ContextInfo{
				MentionedJID: []string{req.RecipientJID},
			},
		},
	}

	// Send message
	_, err = client.SendMessage(context.Background(), groupJID, msg)
	if err != nil {
		fmt.Printf("❌ Failed to send message: %v\n", err)
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(SendMessageResponse{
			Success: false,
			Error:   fmt.Sprintf("Failed to send message: %v", err),
		})
		return
	}

	fmt.Printf("✅ Sent feedback to %s in group %s\n", req.RecipientJID, req.GroupJID)

	// Success response
	json.NewEncoder(w).Encode(SendMessageResponse{
		Success: true,
		Message: "Message sent successfully",
	})
}
