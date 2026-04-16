# ⏰ Time Conversion Reference for ThirteenYearAuction

## 🔄 Common Time Conversions

The interactive deployment now uses **minutes** for easier configuration. Here's a quick reference:

### ⚡ Quick Conversions

| Duration | Minutes | Hours | Days | Example Use Case |
|----------|---------|-------|------|------------------|
| 1 minute | `1` | 0.02h | - | Ultra-fast testing |
| 5 minutes | `5` | 0.08h | - | Quick testing |
| 15 minutes | `15` | 0.25h | - | Short testing |
| 30 minutes | `30` | 0.5h | - | Medium testing |
| 1 hour | `60` | 1h | - | Hourly auctions |
| 2 hours | `120` | 2h | - | Bi-hourly auctions |
| 6 hours | `360` | 6h | - | Quarter-daily auctions |
| 12 hours | `720` | 12h | - | Twice-daily auctions |
| **1 day** | **`1,440`** | **24h** | **1d** | **Daily auctions** |
| 2 days | `2,880` | 48h | 2d | Bi-daily auctions |
| 3 days | `4,320` | 72h | 3d | Tri-daily auctions |
| **1 week** | **`10,080`** | **168h** | **7d** | **Weekly auctions** |
| 2 weeks | `20,160` | 336h | 14d | Bi-weekly auctions |
| **1 month** | **`43,200`** | **720h** | **30d** | **Monthly auctions** |

### 🎯 Recommended Configurations

#### Daily Auctions (Production)
```
Auction Duration: 1,440 minutes (24 hours)
Rest Duration: 1,440 minutes (24 hours)
Rest Interval: 30 auctions (monthly rest)
```

#### Hourly Auctions (Testing)
```
Auction Duration: 60 minutes (1 hour)  
Rest Duration: 60 minutes (1 hour)
Rest Interval: 24 auctions (daily rest)
```

#### Quick Testing
```
Auction Duration: 5 minutes
Rest Duration: 2 minutes  
Rest Interval: 3 auctions
```

#### Weekly Auctions (Long-term)
```
Auction Duration: 10,080 minutes (1 week)
Rest Duration: 10,080 minutes (1 week)
Rest Interval: 4 auctions (monthly rest)
```

### 📊 Interactive Examples

When the deployment asks:

**"Auction duration (minutes):"**
- For 1 hour auctions: `60`
- For 24 hour auctions: `1440`
- For 1 week auctions: `10080`

**"Rest duration (minutes):"**
- For 30 minute rest: `30`
- For 24 hour rest: `1440` 
- For 1 week rest: `10080`

### 🧮 Quick Formula

```
Minutes = Hours × 60
Minutes = Days × 1,440
Minutes = Weeks × 10,080
```

### 💡 Pro Tips

1. **Testing**: Start with small values (5-15 minutes) for rapid testing
2. **Staging**: Use 60-120 minutes for staging environments  
3. **Production**: Use 1,440 minutes (24 hours) for daily auctions
4. **Rest Periods**: Typically match or exceed auction duration
5. **Rest Intervals**: 7 for weekly, 30 for monthly, 365 for yearly

---

**The deployment script now makes it easy to configure precise timing in minutes! 🚀**