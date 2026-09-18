# Spike: daylight and weather

Both sources rendered through the shared strip renderer in `strip.ts`.
A column's value is a height; the partial cell at the top of that height
gets a lighter shade, so a curve antialiases instead of stepping.

Nothing here is wired into the Regenerate workflow.

---

## Daylight

The sun's arc across one day. 64 columns = 24 hours, height = altitude,
normalised against a true overhead sun so latitude and season both read.
No API and no key — this is computed from the date and a latitude.

### Berlin, 52.5°N

**Midwinter** — 7.4h of daylight

```
                                                                
                                                                
                    ░░░░░▒▒▒▒▒▒▒▒▒░░░░░                         
```

**Spring equinox** — 11.8h of daylight

```
                                                                
                        ░░░░░░░░░░░                             
              ░░░▒▒▒▓▓███████████████▓▓▓▒▒░░░                   
```

**Midsummer** — 16.6h of daylight

```
                            ░░░                                 
                 ░░░░▒▒▓▓▓████████▓▓▒▒▒░░░                      
        ░░░░▒▒▓▓███████████████████████████▓▓▒▒▒░░░             
```

### London, 51.5°N

**Midwinter** — 7.6h of daylight

```
                                                                
                                                                
                      ░░░░░▒▒▒▒▒▒▒▒▒▒░░░░░                      
```

**Spring equinox** — 11.8h of daylight

```
                                                                
                          ░░░░░░░░░░░░                          
                ░░░░▒▒▓▓████████████████▓▓▒▒░░░░                
```

**Midsummer** — 16.4h of daylight

```
                              ░░░░                              
                    ░░░▒▒▓▓▓████████▓▓▓▒▒░░░                    
          ░░░░▒▒▓▓▓██████████████████████████▓▓▓▒▒░░░░          
```

### Lisbon, 38.7°N

**Midwinter** — 9.3h of daylight

```
                                                                
                                                                
                     ░░░░▒▒▓▓▓▓█████▓▓▓▓▒▒▒░░░                  
```

**Spring equinox** — 11.9h of daylight

```
                                                                
                         ░░░▒▒▒▓▓▓▓▓▒▒▒░░░                      
                  ░░░▒▓▓███████████████████▓▓▒▒░░               
```

**Midsummer** — 14.7h of daylight

```
                            ░░░▒▒▒▒▒░░░                         
                     ░░░▒▒▓█████████████▓▓▒░░░                  
              ░░░▒▒▓▓██████████████████████████▓▒▒░░░           
```

### Reykjavik, 64.1°N

**Midwinter** — 3.5h of daylight

```
                                                                
                                                                
                               ░░░░░░░░░░                       
```

**Spring equinox** — 11.8h of daylight

```
                                                                
                                                                
                    ░░░░░▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒░░░░             
```

**Midsummer** — 20.5h of daylight

```
                                                                
                        ░░░░░▒▒▒▒▒▓▓▓▓▒▒▒▒▒░░░░░                
         ░░░░░░░▒▒▒▓▓▓███████████████████████████▓▓▓▓▒▒▒░░░░░░░ 
```

---

## Weather

64 columns = the coming 7 days. Height is temperature across the week's
own range; the dithered marks above the fill are precipitation.

> Generated from a synthetic week — this sandbox cannot reach
> api.open-meteo.com. The shape is representative; the numbers are not.

**Temperature 5.4–19.0°C over 168h, two rain fronts**

```
    ░▓█▒     ░▓▓▒     ░▒▓░      ▒▒░      ░▒░    ░ ░░░       ░   
░ ░▒████▓░  ▒████▓   ░████▓   ░▓███▒    ▓███▒    ▒███▒    ░███░ 
█▓████████▓▓███████▒▓███████▒▒██████▓░▒██████▓░░▓█████▓░░▒█████▒
```

**Temperature alone, no precipitation overlay** — near-identical, which is the problem

```
    ░▓█▒     ░▓▓▒     ░▒▓░      ▒▒░      ░▒░      ░░░       ░   
░ ░▒████▓░  ▒████▓   ░████▓   ░▓███▒    ▓███▒    ▒███▒    ░███░ 
█▓████████▓▓███████▒▓███████▒▒██████▓░▒██████▓░░▓█████▓░░▒█████▒
```

### Second encoding: rain darkens the band instead of sitting above it

Temperature smoothed over a 24h window so the strip reads as seven days
rather than seven spikes, with precipitation driving the shade.

**Smoothed temperature, rain as shade**

```
                                                                
▒▓▓██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░░▒▒▓
████████████████████████▓███████████████████████▒█▓▒████████████
```

**Smoothed temperature alone, for comparison**

```
                                                                
▒▓▓██▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░░▒▒▓
████████████████████████████████████████████████████████████████
```

**Precipitation alone, as height**

```
                                                ░               
                        ░                       █ ░▓            
                        █                       █▒██            
```

---

## Both at once

The two do not have to compete for the same three rows. Daylight gives
the shape — the sun's arc for the day — and cloud cover drives the shade,
so the strip shows the sun's path and whether you would actually see it.
One variable per channel, which is what the grid can carry.

**Berlin, 52.5°N, clear day**

```
                                                                
                       ░░░░░░░░░░░░░                            
             ░░░░▒▒▓▓▓███████████████▓▓▓▒▒░░░░                  
```

**Berlin, 52.5°N, broken cloud**

```
                                                                
                       ░░░░░░░░░░░░░                            
             ░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒░░░░░░░░                  
```

**Berlin, 52.5°N, overcast and wet**

```
                                                                
                       ░░░░░░░░░░░░░                            
             ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                  
```
