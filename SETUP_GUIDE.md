# Smart Pet Feeder - Complete Setup & Configuration Guide

## 📋 Project Overview
- **Frontend**: React + Tailwind (Vite)
- **Backend**: Node.js + Express + MongoDB Atlas
- **Hardware**: ESP32 + Servo Motor
- **Communication**: MQTT for real-time hardware control

---

## 🔧 Part 1: Server Setup (Backend)

### Step 1: MongoDB Atlas Configuration
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user with password
4. Whitelist your IP address
5. Get connection string: Clusters → Connect → Connect Your Application
6. Copy the string format: `mongodb+srv://username:password@cluster.mongodb.net/petfeeder?retryWrites=true&w=majority`

### Step 2: Environment Variables
1. Open `/server/.env`
2. Replace credentials:
   ```
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/petfeeder?retryWrites=true&w=majority
   JWT_SECRET=<generate-secure-32-char-string>
   PORT=5000
   CLIENT_URL=http://localhost:3000
   MQTT_BROKER=mqtt://broker.hivemq.com
   ```

3. Generate secure JWT_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

### Step 3: Start Server
```bash
cd server
npm install
npm start
```
✓ Should see: "Connected to MongoDB" and "Server running on port 5000"

---

## 🎨 Part 2: Client Setup (Frontend)

### Step 1: Environment Configuration
1. Create `/client/.env.local`:
   ```
   VITE_API_URL=http://localhost:5000/api
   ```

2. For production:
   ```
   VITE_API_URL=https://your-production-api.com/api
   ```

### Step 2: Start Client
```bash
cd client
npm install
npm run dev
```
✓ Should see: "Local: http://localhost:5173" (or similar)

### Step 3: Test Login
1. Open http://localhost:5173
2. Sign up with test email/password
3. Try manual feed and schedule features

---

## 📱 Part 3: ESP32 Hardware Integration

### Prerequisites
- ESP32 board (e.g., ESP32-WROOM-32)
- Servo motor (e.g., SG90)
- WiFi network
- MicroPython or Arduino IDE

### Wiring Diagram
```
ESP32 GPIO 18 → Servo Signal (Yellow)
ESP32 GND → Servo GND (Brown)
ESP32 5V → Servo VCC (Red)
```

### Step 1: Get Your User ID
1. After login, open browser DevTools (F12)
2. Go to Network tab
3. Trigger "Manual Feed"
4. Click the `/api/feed/manual` request
5. In Response, note the `user.id` field

Alternative - Check MongoDB:
```bash
# Connect to MongoDB Atlas and run:
db.users.findOne({ email: "your_email@example.com" })
# Copy the _id field
```

### Step 2: Flash MicroPython to ESP32
```bash
# Install esptool
pip install esptool

# Download firmware from micropython.org
# Flash to ESP32:
esptool.py --chip esp32 --port /dev/ttyUSB0 erase_flash
esptool.py --chip esp32 --port /dev/ttyUSB0 write_flash -z 0x1000 esp32-20240105-v1.22.1.bin
```

### Step 3: Upload ESP32 Code
Copy this to `main.py` on ESP32 (use Thonny IDE):

```python
import machine
import time
import network
from umqtt.simple import MQTTClient
import json

# WiFi credentials
WIFI_SSID = 'your_wifi_ssid'
WIFI_PASSWORD = 'your_wifi_password'

# MQTT settings
MQTT_BROKER = 'broker.hivemq.com'
YOUR_USER_ID = 'YOUR_MONGODB_USER_ID_HERE'  # Replace with actual ID from step 1
MQTT_TOPIC = f'petfeeder/{YOUR_USER_ID}/feed'

# Servo setup
servo_pin = machine.Pin(18, machine.Pin.OUT)
servo = machine.PWM(servo_pin, freq=50)

def set_servo_angle(angle):
    """Convert angle (0-180) to PWM duty"""
    duty = int((angle / 180) * 1023 + 26)
    servo.duty(duty)

def feed_pet(duration_ms):
    """Rotate servo to dispense food"""
    set_servo_angle(90)  # Open food dispenser
    time.sleep(duration_ms / 1000.0)
    set_servo_angle(0)   # Close dispenser

def connect_wifi():
    """Connect to WiFi"""
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(WIFI_SSID, WIFI_PASSWORD)
    max_wait = 10
    while max_wait > 0 and not wlan.isconnected():
        time.sleep(1)
        max_wait -= 1
    if wlan.isconnected():
        print('WiFi connected:', wlan.ifconfig())
    else:
        print('WiFi failed')

def mqtt_callback(topic, msg):
    """Handle incoming MQTT messages"""
    try:
        data = json.loads(msg.decode())
        print(f'Received: {data}')
        
        if data.get('command') == 'feed_now':
            # Calculate duration based on portion level
            level = data.get('level', 'medium')
            if level == 'low':
                duration = 20000  # 20 seconds
            elif level == 'high':
                duration = 60000  # 60 seconds
            else:
                duration = 40000  # 40 seconds (medium)
            
            print(f'Feeding for {duration}ms...')
            feed_pet(duration)
            print('Feeding complete')
    except Exception as e:
        print(f'Error: {e}')

# Main execution
print('Starting Smart Pet Feeder...')
connect_wifi()

# Connect to MQTT broker
client = MQTTClient('esp32_feeder', MQTT_BROKER)
client.set_callback(mqtt_callback)
client.connect()
client.subscribe(MQTT_TOPIC)
print(f'Listening on topic: {MQTT_TOPIC}')

# Keep connection alive
while True:
    try:
        client.check_msg()
        time.sleep(1)
    except Exception as e:
        print(f'MQTT error: {e}')
        time.sleep(5)
```

### Step 4: Test Hardware
1. Upload code to ESP32
2. Open serial monitor to see logs
3. Trigger "Manual Feed" from app
4. ESP32 should receive message and rotate servo

---

## ✅ Credentials Checklist

- [ ] MongoDB Atlas credentials in `.env`
- [ ] JWT_SECRET generated and set
- [ ] WiFi SSID/PASSWORD in ESP32 code
- [ ] YOUR_USER_ID in ESP32 code
- [ ] VITE_API_URL in client `.env.local`
- [ ] Servo wired to GPIO 18 on ESP32
- [ ] ESP32 has WiFi connectivity

---

## 🐛 Troubleshooting

### Login not working?
- Check MongoDB connection in `.env`
- Verify JWT_SECRET is set
- Check server logs for connection errors

### ESP32 not receiving commands?
- Verify WiFi is connected (check serial output)
- Confirm MQTT_TOPIC matches YOUR_USER_ID
- Check MQTT broker connectivity

### Servo not moving?
- Verify servo power connection (5V)
- Check signal wire on GPIO 18
- Test with simple PWM test script first

---

## 🚀 Production Deployment

### Server Deployment (e.g., Heroku, Railway, Render)
1. Set environment variables on hosting platform
2. Ensure MongoDB Atlas allows connection from server IP
3. Update `CLIENT_URL` to your production frontend URL

### Client Deployment (e.g., Vercel, Netlify)
1. Update `VITE_API_URL` to production backend
2. Build: `npm run build`
3. Deploy the `dist/` folder

