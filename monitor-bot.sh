#!/data/data/com.termux/files/usr/bin/bash

# Cyberpunk Colors (RGB)
NEON_PINK='\033[38;2;255;0;255m'
CYAN='\033[38;2;0;255;255m'
E_BLUE='\033[38;2;50;150;255m'
NEON_GREEN='\033[38;2;57;255;20m'
RED='\033[0;31m'
NC='\033[0m'

# Log file for automation actions
LOG_FILE="/data/data/com.termux/files/home/.pm2/logs/auto-monitor.log"
touch "$LOG_FILE"

# Function to auto-restart service
auto_restart() {
  local name=$1
  echo "$(date '+%H:%M:%S') - [AUTO-FIX] Restarting $name" >> "$LOG_FILE"
  /data/data/com.termux/files/usr/bin/node /data/data/com.termux/files/usr/lib/node_modules/pm2/bin/pm2 restart "$name" > /dev/null
}

# Clear once at start
clear

while true; do
  # Header (static, no clearing)
  printf "\033[H"
  echo -e "${NEON_PINK}╔══════════════════════════════════════════════════════════════════════════════════╗${NC}"
  echo -e "${NEON_PINK}║${NC}        ${CYAN}🚀  BOT ALLIN DASHBOARD V2.4 (FIXED METRICS)      ${NEON_PINK}║${NC}"
  echo -e "${NEON_PINK}╚══════════════════════════════════════════════════════════════════════════════════╝${NC}"
  echo -e "🕒 ${CYAN}Time:${NC} $(date '+%H:%M:%S %d/%m/%Y')"
  echo ""

  # System Resources
  echo -e "${E_BLUE}--- 🖥️  SYSTEM RESOURCES ---${NC}"
  cpu_load=$(uptime | awk -F'load average:' '{ print $2 }' | cut -d, -f1 | sed 's/ //g')
  ram_usage=$(free -m | awk 'NR==2{printf "%.2f%%", $3*100/$2 }')
  echo -e " CPU Load: ${NEON_GREEN}${cpu_load}${NC} | RAM Usage: ${NEON_GREEN}${ram_usage}${NC}"
  echo ""

  # Webhook Status & Detailed Metrics
  echo -e "${E_BLUE}--- ⚙️  WEBHOOK SERVER STATUS & METRICS ---${NC}"
  # Header tối giản
  echo -e "${CYAN}NAME             STATUS    HEALTH    UPTIME/MEM${NC}"
  
  /data/data/com.termux/files/usr/bin/node /data/data/com.termux/files/usr/lib/node_modules/pm2/bin/pm2 jlist | /data/data/com.termux/files/usr/bin/jq -r '.[] | [.name, .pm2_env.status] | @tsv' | while read -r name status; do
    
    # Trạng thái dịch vụ (chỉ text để tính width)
    if [ "$status" == "online" ]; then
        status_display="${NEON_GREEN}●${NC}"
        status_raw="online"
    else
        status_display="${RED}○${NC}"
        status_raw="offline"
    fi
    
    health_display="-"
    metrics="-"
    
    # Kiểm tra chi tiết nếu là pusher
    if [[ "$name" == *"pusher"* ]]; then
        data=$(curl -s http://localhost:3000/health)
        if [ $? -eq 0 ] && [ -n "$data" ]; then
            # Parse chi tiết từng loại
            crypto_alive=$(echo "$data" | /data/data/com.termux/files/usr/bin/jq -r '.crypto.alive')
            exchange_alive=$(echo "$data" | /data/data/com.termux/files/usr/bin/jq -r '.exchange.alive')
            fuel_alive=$(echo "$data" | /data/data/com.termux/files/usr/bin/jq -r '.fuel.alive')
            news_alive=$(echo "$data" | /data/data/com.termux/files/usr/bin/jq -r '.news.alive')
            
            # Tạo chuỗi trạng thái chi tiết
            health_display=""
            [ "$crypto_alive" == "true" ] && health_display+="C:${NEON_GREEN}●${NC} " || health_display+="C:${RED}○${NC} "
            [ "$exchange_alive" == "true" ] && health_display+="E:${NEON_GREEN}●${NC} " || health_display+="E:${RED}○${NC} "
            [ "$fuel_alive" == "true" ] && health_display+="F:${NEON_GREEN}●${NC} " || health_display+="F:${RED}○${NC} "
            [ "$news_alive" == "true" ] && health_display+="N:${NEON_GREEN}●${NC}" || health_display+="N:${RED}○${NC}"
            
            uptime_val=$(echo "$data" | /data/data/com.termux/files/usr/bin/jq -r '.server.uptime')
            uptime_formatted=$(printf "%d:%02d" $((uptime_val/3600)) $(( (uptime_val%3600)/60 )))
            mem_usage=$(/data/data/com.termux/files/usr/bin/node /data/data/com.termux/files/usr/lib/node_modules/pm2/bin/pm2 jlist | /data/data/com.termux/files/usr/bin/jq -r --arg n "$name" '.[] | select(.name == $n) | .monit.memory')
            mem_formatted=$(($mem_usage / 1024 / 1024))MB
            metrics="${uptime_formatted}h | ${mem_formatted}"
        else
            health_display="${RED}FAIL${NC}"
        fi
    fi
    
    # Automation
    if [ "$status" != "online" ] || [[ "$health_display" == *"${RED}○${NC}"* ]] || [[ "$health_display" == "${RED}FAIL${NC}" ]]; then
        auto_restart "$name"
    fi
    
    # Render từng phần để tránh lỗi padding của mã ANSI
    printf "%-16s %-9b %-16b %-20s\n" "$name" "$status_display" "$health_display" "$metrics"
  done
  echo ""
  
  # SYSTEM LOGS
  echo -e "${E_BLUE}--- 📜 SYSTEM LOGS (LAST 3) ---${NC}"
  tail -n 3 "$LOG_FILE"
  echo -e "
" 
  
  echo -e "${NEON_PINK}══════════════════════════════════════════════════════════════════════════════════${NC}"
  echo -e "      ${CYAN}Press ${NEON_GREEN}Ctrl+C${NC} to exit dashboard | Refresh rate: 10s${NC}"
  
  sleep 10
done
