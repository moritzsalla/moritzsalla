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

### Amsterdam

**Midwinter** — 7.7h of daylight

```
                                                                
                                                                
                        ░░░░░▒▒▒▒▒▒▒▒▒░░░░░░                    
```

**Spring equinox** — 12.0h of daylight

```
                                                                
                            ░░░░░░░░░░░░                        
                  ░░░▒▒▒▓▓███████████████▓▓▓▒▒░░░░              
```

**Midsummer** — 16.8h of daylight

```
                                   ░░░                          
                        ░░░▒▒▒▓▓████████▓▓▓▒▒▒░░░               
              ░░░░▒▒▒▓▓███████████████████████████▓▓▒▒░░░░      
```

### Lisbon, 38.7°N

**Midwinter** — 9.5h of daylight

```
                                                                
                                                                
                     ░░░░▒▒▓▓▓▓█████▓▓▓▓▒▒▒░░░                  
```

**Spring equinox** — 12.0h of daylight

```
                                                                
                         ░░░▒▒▒▓▓▓▓▓▒▒▒░░░                      
                  ░░░▒▓▓███████████████████▓▓▒▒░░               
```

**Midsummer** — 14.9h of daylight

```
                               ░░░▒▒▒▒░░░░                      
                        ░░░▒▓▓████████████▓▓▒▒░░                
                 ░░░▒▓▓██████████████████████████▓▓▒▒░░░        
```

### Reykjavik, 64.1°N

**Midwinter** — 4.1h of daylight

```
                                                                
                                                                
                               ░░░░░░░░░░                       
```

**Spring equinox** — 12.0h of daylight

```
                                                                
                                                                
                    ░░░░░▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒░░░░             
```

**Midsummer** — 21.1h of daylight

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

**Amsterdam, clear day**

```
                                                                
                              ░░░░░░░░░░░░░                     
                    ░░░░▒▒▓▓▓███████████████▓▓▓▒▒░░░            
```

**Amsterdam, broken cloud**

```
                                                                
                              ░░░░░░░░░░░░░                     
                    ░░░░░░░░░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░            
```

**Amsterdam, overcast and wet**

```
                                                                
                              ░░░░░░░░░░░░░                     
                    ░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▒░░░░░            
```

---

## Night, without drawing a moon

The strip already covers a full local day, and most of it is empty. Rather
than put a symbol in that space, the moon draws its own arc in the same
language as the sun, dimmed to its illuminated fraction. A full moon that
rides high is a soft mound; a new moon is nothing at all. No glyph, no
stars — night is simply a fainter version of the same shape.

Amsterdam, one lunar month. Left edge is local midnight, right edge the next.

**2026-09-26** — 100% lit, 11.8h of daylight

```
                                                                
░░░░░░░░░                      ░░░░░░░░░░░                  ░░░░
▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░  ░░░▒▒▒▓▓██████████████▓▓▓▒▒░░░░░░░░░▒▒▒▒▒▒▒
```

**2026-09-30** — 79% lit, 11.5h of daylight

```
           ░                                                    
░░░░░░░▒▒▒▒▒▒▒▒▒░░░░░           ░░░░░░░░░                       
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░▒▒▓▓▓█████████████▓▓▓▒▒░░░   ░░░░░░░░▒▒
```

**2026-10-04** — 35% lit, 11.3h of daylight

```
                   ░░░                                          
         ░░░░░░░░░░░░░           ░░░░░░░                        
░░░░░░░░░░░░░░░░░░░░░░░░░▒▒▒▓▓▓███████████▓▓▓▒▒▒░░░             
```

**2026-10-08** — 3% lit, 11.0h of daylight

```
                                                                
                                  ░░░░                          
                      ░░░░▒▒▓▓▓▓█████████▓▓▓▓▒▒░░░░             
```

**2026-10-16** — 34% lit, 10.4h of daylight

```
                                                                
                                                                
                       ░░░▒▒▒▓▓▓▓▓█████▓▓▓▓▒▒▒░░░░░░░░░░░       
```

**2026-10-22** — 88% lit, 10.1h of daylight

```
                                                                
                                                        ░░░░░░░░
▒░░░░░░░░░             ░░░░▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒░░░░░░░▒▒▒▒▒▒▒▒▒▒▒
```

---

## Weather as the arc's character

Weather does not get its own rows — it acts on the arc. That is what it
does in life: a clear day has a hard directional peak, thick low cloud
turns the light diffuse until the peak flattens into a band, and rain and
wind break up the edge. No symbols, same language as the sun and moon.

The same Amsterdam day, 20 October, under each condition Open-Meteo
reports.

**clear**

```
                             ░░▒▓▓█████▓▓▒░                     
                          ░▒▓███████████████▓▒░                 
░░░                    ░▒▓█████████████████████▓▒░░░░░░░░░░░░░░░
```

**cloudy**

```
                              ░░▒▒▒▒▒▒▒▒░░░                     
                         ░░▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒░░                
░░░                    ▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░
```

**overcast**

```
                                 ░░░░░░░                        
                       ░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░               
░░░                    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░
```

**fog**

```
                                                                
                       ░░░▒▒▒░▒░▒▒▒▒▒░▒▒▒▒░░▒▒▒░▒               
░░░                    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░
```

**drizzle**

```
                                   ░  ░                         
                       ░░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░               
░░░                    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░
```

**rain**

```
                                                                
                       ░░░░░░░░░░░░▒░░▒░░░░░░░░░░               
░░░                    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░
```

**showers**

```
                                  ░░  ░░                        
                          ░░░░▒▒▒▒▒▒▒▒▒▒▒▒░░░░░ ░               
░░░                    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░
```

**snow**

```
                                                                
                       ░▒░▒▒▒▒▒▒▒▒▒▒▒▒▓▒▒▒▒▒▒▒▒░▒               
░░░                    ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░
```

**storm**

```
                                                                
                       ░░░░░░░░░░░░░░░░░░░░░░░░░░               
░░░                    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
```

### Cloud height, not just cloud amount

Open-Meteo splits cover into low, mid and high. Cirrus thins the light
without killing the shadow; stratus sitting on the city does.

**high cirrus only, 80%**

```
                             ░░░▒▒▓▓▓▓▓▒▒░░                     
                          ░▒▓██████████████▓▓▒░                 
░░░                    ░▒▓█████████████████████▓▒░░░░░░░░░░░░░░░
```

**mid altocumulus, 80%**

```
                              ░░░░░▒▒░░░░░░                     
                        ░░░▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒░░                
░░░                    ▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░
```

**low stratus, 80%**

```
                              ░░░░░░░░░░░░░                     
                       ░░░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░               
░░░                    ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░░░░░░░░░░░░░░
```

### WMO code mapping

```
 0 -> clear
 1 -> cloudy
 2 -> cloudy
 3 -> overcast
45 -> fog
48 -> fog
51 -> drizzle
55 -> drizzle
61 -> rain
65 -> rain
71 -> snow
75 -> snow
80 -> showers
82 -> showers
85 -> snow
95 -> storm
99 -> storm
```
