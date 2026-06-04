# ESP32 Smart Pet Feeder - Arduino Setup Guide

## 📋 Key Changes from Original Code

| Aspect | Original | Updated |
|--------|----------|---------|
| **Durations** | 2s, 4s, 6s | 20s, 40s, 60s (matches backend) |
| **Topic** | Hardcoded placeholder | Dynamically constructed from user_id |
| **Error Handling** | Minimal | Added WiFi/MQTT status tracking |
| **Serial Logging** | Basic | Comprehensive debug messages |
| **Reconnect Logic** | Always loop | Rate-limited to 5-second intervals |
| **JSON Parsing** | Simple string match | Handles both JSON and plain text |

---

## 🔧 Step 1: Arduino IDE Setup

### Install Required Libraries

1. Open Arduino IDE
2. Go to **Sketch → Include Library → Manage Libraries**
3. Search and install:
   - **WiFi** (built-in for ESP32)
   - **PubSubClient** by Nick O'Leary
   - **ESP32Servo** by Kevin Harrington

Alternatively, paste in Library Manager:
```
PubSubClient
ESP32Servo
```

---

## ⚙️ Step 2: Get Your User ID

### Option A: From MongoDB Atlas (Recommended)
1. Go to MongoDB Atlas → Collections
2. Find your user in the `users` collection
3. Copy the `_id` field (looks like: `507f1f77bcf86cd799439011`)

### Option B: From Browser DevTools (After App Login)
1. Open app at http://localhost:5173
2. Sign up / Log in
3. Open Browser DevTools (F12) → Network tab
4. Trigger "Manual Feed"
5. Look at the request headers or response
6. Find the user ID (usually in JWT token or response)

### Option C: From Server Logs
1. Start server: `cd server && npm start`
2. Check console for user creation logs
3. It will print the user ID

---

## 📝 Step 3: Update ESP32 Code

Replace these values in `petfeeder.ino`:

```cpp
// Line 9-10: WiFi Credentials (Already correct for you)
const char* ssid = "Oppo";
const char* password = "123456789k";

// Line 16: IMPORTANT - Replace with YOUR actual user ID
const char* user_id = "507f1f77bcf86cd799439011";  // Replace this!
```

**Full example:**
```cpp
const char* user_id = "507f1f77bcf86cd799439011";
// After update, topic will be: petfeeder/507f1f77bcf86cd799439011/feed
```

---

## 🚀 Step 4: Flash to ESP32

1. Connect ESP32 to USB cable
2. In Arduino IDE:
   - **Tools → Board** → Select "ESP32 Dev Module"
   - **Tools → Port** → Select your COM port
   - **Tools → Upload Speed** → 115200
3. Click **Upload** button
4. Wait for "Hard resetting via RTS pin..."

---

## ✅ Step 5: Verify Connection

1. Open **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. You should see (**within 30 seconds**):

```
================================================
      Smart Pet Feeder - ESP32 Starting
================================================
[Config] User ID: 507f1f77bcf86cd799439011
[Config] MQTT Topic: petfeeder/507f1f77bcf86cd799439011/feed
[Config] MQTT Broker: broker.hivemq.com:1883

[WiFi] Connecting to: Oppo
..................
[WiFi] Connected!
[WiFi] IP address: 192.168.x.x

[Ready] Waiting for MQTT connection...
================================================

[MQTT] Attempting to connect...
[MQTT] Connected!
[MQTT] Subscribing to: petfeeder/507f1f77bcf86cd799439011/feed
```

---

## 🧪 Step 6: Test the System

### Test 1: Manual Feed from App
1. Open http://localhost:5173
2. Log in with your test account
3. Click **"Feed Now"** button
4. **Expected**: ESP32 receives message and servo rotates

Serial monitor should show:
```
[MQTT] Message received on topic: petfeeder/507f1f77bcf86cd799439011/feed
[MQTT] Payload: {"command":"feed_now","level":"medium","timestamp":1713612345}
[Feed] Triggering feed - Level: medium, Duration: 40000ms
[Servo] Starting feed sequence - Level: medium, Duration: 40000ms
[Servo] Opening (angle: 90)
[Servo] Closing (angle: 0)
[Servo] Feeding complete!
```

### Test 2: Schedule Feed
1. Go to **Schedule** tab in app
2. Add a time (e.g., Set for 1 minute from now)
3. Wait for the scheduled time
4. ESP32 should automatically feed

### Test 3: Portion Size
1. Go to **Dashboard** → **Portion Size**
2. Select "Low" (20 seconds)
3. Click "Feed Now"
4. Verify servo opens for 20 seconds only

---

## 🔌 Wiring Verification

```
ESP32 Pin 18 ──→ Servo Signal Wire (Yellow)
ESP32 GND    ──→ Servo GND Wire (Brown)
ESP32 5V     ──→ Servo VCC Wire (Red)
```

### Testing Servo Independently
If servo isn't responding, test with this simple code:

```cpp
#include <ESP32Servo.h>

Servo testServo;
void setup() {
  testServo.attach(18);
  testServo.write(0);    // Close
  delay(1000);
  testServo.write(90);   // Open
  delay(1000);
  testServo.write(0);    // Close
}
void loop() {}
```

---

## 🐛 Troubleshooting

### ESP32 won't connect to WiFi
**Solution:**
- Double-check SSID and password
- Make sure WiFi is not in 5GHz mode (ESP32 needs 2.4GHz)
- Try restarting WiFi router

### Connected to WiFi but MQTT fails
**Solution:**
- Check internet connectivity
- Verify broker is reachable: ping broker.hivemq.com
- Make sure port 1883 isn't blocked by firewall

### Servo doesn't move
**Solution:**
- Test servo power separately
- Check GPIO 18 is not in use by other code
- Verify servo signal cable on correct pin
- Check servo servo library is installed

### "YOUR_USER_ID" error in messages
**Solution:**
- You forgot to replace the placeholder!
- Open code and search for `YOUR_USER_ID`
- Replace with your actual MongoDB user ID

---

## 📊 Serial Monitor Debug Reference

| Message | Meaning | Action |
|---------|---------|--------|
| `[WiFi] Connected!` | ESP32 on WiFi | ✓ Good |
| `[MQTT] Connected!` | Connected to broker | ✓ Good |
| `[MQTT] Failed to connect, rc=1` | Wrong broker/port | Check MQTT_BROKER and mqtt_port |
| `[MQTT] Failed to connect, rc=4` | Authentication error | Some brokers need credentials |
| `[Servo] Opening` | Servo received command | Check servo power |

---

## 🔐 Security Note

This setup uses a **public MQTT broker** (broker.hivemq.com) for testing. For production:

1. Set up a **private MQTT broker**:
   ```bash
   # Using Mosquitto:
   sudo apt-get install mosquitto mosquitto-clients
   ```

2. Update code:
   ```cpp
   const char* mqtt_server = "your-private-broker.com";
   const char* mqtt_user = "username";
   const char* mqtt_pass = "password";
   
   // Add authentication:
   if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
     // ...
   }
   ```

---

## 📱 Mobile/Remote Access

To trigger feeding from anywhere:

1. Deploy backend to cloud (Heroku, Railway, Render)
2. Update client `VITE_API_URL` to cloud URL
3. ESP32 will subscribe to MQTT and receive commands globally
4. Access app from phone on any network

---

## ✨ Next Steps

- [ ] Replace `YOUR_USER_ID` with actual ID
- [ ] Verify WiFi credentials are correct
- [ ] Upload code to ESP32
- [ ] Check Serial Monitor for successful connection
- [ ] Test feed from app
- [ ] Test scheduled feeds
- [ ] Test different portion sizes

