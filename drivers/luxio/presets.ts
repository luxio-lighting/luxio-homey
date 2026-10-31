// Bundled from app.luxio.lighting/src/{colors,presets}.json.
// Firmware parses animation parameter defaults from the source.
type RGB = { red: number; green: number; blue: number };
type Preset = { id: string; name: string } & (
  { kind: 'color'; color: RGB } | { kind: 'gradient'; colors: RGB[] } | { kind: 'animation'; source: string }
);

export const presets: Preset[] = [
  {
    "id": "ruby",
    "kind": "color",
    "name": "Ruby",
    "color": {
      "red": 255,
      "green": 0,
      "blue": 0
    }
  },
  {
    "id": "coral",
    "kind": "color",
    "name": "Coral",
    "color": {
      "red": 255,
      "green": 100,
      "blue": 80
    }
  },
  {
    "id": "nightlight",
    "kind": "color",
    "name": "Nightlight",
    "color": {
      "red": 255,
      "green": 80,
      "blue": 20
    }
  },
  {
    "id": "golden-hour",
    "kind": "color",
    "name": "Golden hour",
    "color": {
      "red": 255,
      "green": 110,
      "blue": 25
    }
  },
  {
    "id": "amber",
    "kind": "color",
    "name": "Amber",
    "color": {
      "red": 255,
      "green": 150,
      "blue": 0
    }
  },
  {
    "id": "relax",
    "kind": "color",
    "name": "Relax",
    "color": {
      "red": 255,
      "green": 185,
      "blue": 80
    }
  },
  {
    "id": "read",
    "kind": "color",
    "name": "Read",
    "color": {
      "red": 255,
      "green": 220,
      "blue": 160
    }
  },
  {
    "id": "sunshine",
    "kind": "color",
    "name": "Sunshine",
    "color": {
      "red": 255,
      "green": 225,
      "blue": 0
    }
  },
  {
    "id": "lemon",
    "kind": "color",
    "name": "Lemon",
    "color": {
      "red": 235,
      "green": 255,
      "blue": 40
    }
  },
  {
    "id": "lime",
    "kind": "color",
    "name": "Lime",
    "color": {
      "red": 145,
      "green": 255,
      "blue": 30
    }
  },
  {
    "id": "green",
    "kind": "color",
    "name": "Green",
    "color": {
      "red": 30,
      "green": 255,
      "blue": 35
    }
  },
  {
    "id": "emerald",
    "kind": "color",
    "name": "Emerald",
    "color": {
      "red": 0,
      "green": 255,
      "blue": 110
    }
  },
  {
    "id": "mint",
    "kind": "color",
    "name": "Mint",
    "color": {
      "red": 30,
      "green": 230,
      "blue": 150
    }
  },
  {
    "id": "turquoise",
    "kind": "color",
    "name": "Turquoise",
    "color": {
      "red": 0,
      "green": 255,
      "blue": 220
    }
  },
  {
    "id": "cyan",
    "kind": "color",
    "name": "Cyan",
    "color": {
      "red": 0,
      "green": 255,
      "blue": 255
    }
  },
  {
    "id": "concentrate",
    "kind": "color",
    "name": "Concentrate",
    "color": {
      "red": 170,
      "green": 225,
      "blue": 255
    }
  },
  {
    "id": "moonlight",
    "kind": "color",
    "name": "Moonlight",
    "color": {
      "red": 125,
      "green": 175,
      "blue": 255
    }
  },
  {
    "id": "ocean",
    "kind": "color",
    "name": "Ocean",
    "color": {
      "red": 10,
      "green": 90,
      "blue": 255
    }
  },
  {
    "id": "blue",
    "kind": "color",
    "name": "Blue",
    "color": {
      "red": 30,
      "green": 30,
      "blue": 255
    }
  },
  {
    "id": "iris",
    "kind": "color",
    "name": "Iris",
    "color": {
      "red": 125,
      "green": 45,
      "blue": 255
    }
  },
  {
    "id": "violet",
    "kind": "color",
    "name": "Violet",
    "color": {
      "red": 175,
      "green": 30,
      "blue": 255
    }
  },
  {
    "id": "magenta",
    "kind": "color",
    "name": "Magenta",
    "color": {
      "red": 255,
      "green": 30,
      "blue": 220
    }
  },
  {
    "id": "blush",
    "kind": "color",
    "name": "Blush",
    "color": {
      "red": 255,
      "green": 65,
      "blue": 140
    }
  },
  {
    "id": "rose",
    "kind": "color",
    "name": "Rose",
    "color": {
      "red": 255,
      "green": 30,
      "blue": 70
    }
  },
  {
    "id": "rainbow",
    "kind": "animation",
    "name": "Rainbow",
    "source": "-- @preview ff0000,ffff00,00ff00,00ffff,0000ff,ff00ff\n-- @parameter Speed,Slider,50,0,100\n-- @parameter Period,Number,20,1,120\n-- @parameter Reverse,Checkbox,false\nif luxio_fill_hsv and luxio_render_waves then\nfunction setup() end\nfunction loop()\n  local count = luxio_get_pixel_count()\n  local time = luxio_millis() / (luxio_get_parameter(\"Period\") * 1000) * luxio_get_parameter(\"Speed\") / 50\n  if luxio_get_parameter(\"Reverse\") then time = -time end\n  luxio_fill_hsv(time, 1 / count)\nend\nelse\nfunction setup() end\nfunction loop()\n  local count = luxio_get_pixel_count()\n  local time = luxio_millis() / (luxio_get_parameter(\"Period\") * 1000) * luxio_get_parameter(\"Speed\") / 50\n  if luxio_get_parameter(\"Reverse\") then time = -time end\n  for i = 0, count - 1 do\n    local h = (time + i / count) % 1 * 6\n    local sector = math.floor(h)\n    local up = math.floor((h - sector) * 255)\n    local down = 255 - up\n    local r, g, b = 0, 0, 0\n    if sector == 0 then r, g = 255, up\n    elseif sector == 1 then r, g = down, 255\n    elseif sector == 2 then g, b = 255, up\n    elseif sector == 3 then g, b = down, 255\n    elseif sector == 4 then r, b = up, 255\n    else r, b = 255, down end\n    luxio_set_pixel_color(i, r, g, b)\n  end\nend\nend"
  },
  {
    "id": "colorloop",
    "kind": "animation",
    "name": "Colorloop",
    "source": "-- @preview ff0000,ffff00,00ff00,00ffff,0000ff,ff00ff\n-- @parameter Speed,Slider,50,0,100\n-- @parameter Period,Number,20,1,120\n-- @parameter Reverse,Checkbox,false\nif luxio_fill_hsv and luxio_render_waves then\nfunction setup() end\nfunction loop()\n  local count = luxio_get_pixel_count()\n  local time = luxio_millis() / (luxio_get_parameter(\"Period\") * 1000) * luxio_get_parameter(\"Speed\") / 50\n  if luxio_get_parameter(\"Reverse\") then time = -time end\n  luxio_fill_hsv(time, 0)\nend\nelse\nfunction setup() end\nfunction loop()\n  local count = luxio_get_pixel_count()\n  local time = luxio_millis() / (luxio_get_parameter(\"Period\") * 1000) * luxio_get_parameter(\"Speed\") / 50\n  if luxio_get_parameter(\"Reverse\") then time = -time end\n  for i = 0, count - 1 do\n    local h = (time) % 1 * 6\n    local sector = math.floor(h)\n    local up = math.floor((h - sector) * 255)\n    local down = 255 - up\n    local r, g, b = 0, 0, 0\n    if sector == 0 then r, g = 255, up\n    elseif sector == 1 then r, g = down, 255\n    elseif sector == 2 then g, b = 255, up\n    elseif sector == 3 then g, b = down, 255\n    elseif sector == 4 then r, b = up, 255\n    else r, b = 255, down end\n    luxio_set_pixel_color(i, r, g, b)\n  end\nend\nend"
  },
  {
    "id": "aurora",
    "kind": "animation",
    "name": "Aurora",
    "source": "-- @preview 2d1859,8246ff\n-- @parameter Speed,Slider,50,0,100\n-- @parameter Spacing,Number,8,1,64\n-- @parameter Pulse,Checkbox,true\nif luxio_fill_hsv and luxio_render_waves then\nlocal waves = {{offset = 0.675, {amplitude = 0.325}}}\nlocal channels = {{{wave = 1, gain = 130}}, {{wave = 1, gain = 70}}, {{wave = 1, gain = 255}}}\nfunction setup() end\nfunction loop()\n  local phase = luxio_millis() / 1800 * luxio_get_parameter(\"Speed\") / 50\n  local pulse = luxio_get_parameter(\"Pulse\")\n  local spacing = luxio_get_parameter(\"Spacing\")\n  if pulse then\n    waves[1][1].phase, waves[1][1].step = phase, 1 / spacing\n    luxio_render_waves(waves, channels)\n  else\n    luxio_fill(130, 70, 255)\n  end\nend\nelse\nfunction setup() end\nfunction loop()\n  local phase = luxio_millis() / 1800 * luxio_get_parameter(\"Speed\") / 50\n  for i = 0, luxio_get_pixel_count() - 1 do\n    local t = luxio_get_parameter(\"Pulse\") and (0.35 + 0.65 * (math.sin(i / luxio_get_parameter(\"Spacing\") + phase) + 1) / 2) or 1\n    luxio_set_pixel_color(i, math.floor(130 * t), math.floor(70 * t), math.floor(255 * t))\n  end\nend\nend"
  },
  {
    "id": "ember",
    "kind": "animation",
    "name": "Ember",
    "source": "-- @preview 591804,ff460c\n-- @parameter Speed,Slider,50,0,100\n-- @parameter Spacing,Number,8,1,64\n-- @parameter Pulse,Checkbox,true\nif luxio_fill_hsv and luxio_render_waves then\nlocal waves = {{offset = 0.675, {amplitude = 0.325}}}\nlocal channels = {{{wave = 1, gain = 255}}, {{wave = 1, gain = 70}}, {{wave = 1, gain = 12}}}\nfunction setup() end\nfunction loop()\n  local phase = luxio_millis() / 1800 * luxio_get_parameter(\"Speed\") / 50\n  local pulse = luxio_get_parameter(\"Pulse\")\n  local spacing = luxio_get_parameter(\"Spacing\")\n  if pulse then\n    waves[1][1].phase, waves[1][1].step = phase, 1 / spacing\n    luxio_render_waves(waves, channels)\n  else\n    luxio_fill(255, 70, 12)\n  end\nend\nelse\nfunction setup() end\nfunction loop()\n  local phase = luxio_millis() / 1800 * luxio_get_parameter(\"Speed\") / 50\n  for i = 0, luxio_get_pixel_count() - 1 do\n    local t = luxio_get_parameter(\"Pulse\") and (0.35 + 0.65 * (math.sin(i / luxio_get_parameter(\"Spacing\") + phase) + 1) / 2) or 1\n    luxio_set_pixel_color(i, math.floor(255 * t), math.floor(70 * t), math.floor(12 * t))\n  end\nend\nend"
  },
  {
    "id": "tidal",
    "kind": "animation",
    "name": "Tidal",
    "source": "-- @preview 053159,0f8cff\n-- @parameter Speed,Slider,50,0,100\n-- @parameter Spacing,Number,8,1,64\n-- @parameter Pulse,Checkbox,true\nif luxio_fill_hsv and luxio_render_waves then\nlocal waves = {{offset = 0.675, {amplitude = 0.325}}}\nlocal channels = {{{wave = 1, gain = 15}}, {{wave = 1, gain = 140}}, {{wave = 1, gain = 255}}}\nfunction setup() end\nfunction loop()\n  local phase = luxio_millis() / 1800 * luxio_get_parameter(\"Speed\") / 50\n  local pulse = luxio_get_parameter(\"Pulse\")\n  local spacing = luxio_get_parameter(\"Spacing\")\n  if pulse then\n    waves[1][1].phase, waves[1][1].step = phase, 1 / spacing\n    luxio_render_waves(waves, channels)\n  else\n    luxio_fill(15, 140, 255)\n  end\nend\nelse\nfunction setup() end\nfunction loop()\n  local phase = luxio_millis() / 1800 * luxio_get_parameter(\"Speed\") / 50\n  for i = 0, luxio_get_pixel_count() - 1 do\n    local t = luxio_get_parameter(\"Pulse\") and (0.35 + 0.65 * (math.sin(i / luxio_get_parameter(\"Spacing\") + phase) + 1) / 2) or 1\n    luxio_set_pixel_color(i, math.floor(15 * t), math.floor(140 * t), math.floor(255 * t))\n  end\nend\nend"
  },
  {
    "id": "christmas",
    "kind": "animation",
    "name": "Christmas",
    "source": "-- @preview 55381b,ffbe69\nif luxio_fill_hsv and luxio_render_waves then\n-- Soft, independent warm-white twinkles over a steady glow.\nfunction loop()\n  local t = luxio_millis() / 1000\n  local sin, floor, max = math.sin, math.floor, math.max\n  -- Negative twinkles are just the background; fill those pixels in bulk.\n  luxio_fill(40, 30, 16)\n  for i = 0, luxio_get_pixel_count() - 1 do\n    local phase = (sin(i * 127.1 + 311.7) * 43758.5453) % 6.28318\n    local wave = sin(t * (0.8 + (i * 0.618034 % 1) * 1.2) + phase)\n    if wave > 0 then\n      local squared = wave * wave\n      local fourth = squared * squared\n      local glow = 0.16 + 0.84 * fourth * fourth\n      luxio_set_pixel_color(i, floor(255 * glow), floor(190 * glow), floor(105 * glow))\n    end\n  end\nend\nelse\n-- Soft, independent warm-white twinkles over a steady glow.\nfunction loop()\n  local t = luxio_millis() / 1000\n  local sin, floor, max = math.sin, math.floor, math.max\n  for i = 0, luxio_get_pixel_count() - 1 do\n    local phase = (sin(i * 127.1 + 311.7) * 43758.5453) % 6.28318\n    local wave = max(0, sin(t * (0.8 + (i * 0.618034 % 1) * 1.2) + phase))\n    local glow = 0.16 + 0.84 * wave ^ 8\n    luxio_set_pixel_color(i, floor(255 * glow), floor(190 * glow), floor(105 * glow))\n  end\nend\nend"
  },
  {
    "id": "knight-rider",
    "kind": "animation",
    "name": "Knight Rider",
    "source": "-- @preview 230000,ff0000\nif luxio_fill_hsv and luxio_render_waves then\n-- A red scanner with a fading tail, sweeping out and back.\nfunction loop()\n  local count = luxio_get_pixel_count()\n  local phase = (luxio_millis() / 1300) % 2\n  local direction = phase < 1 and 1 or -1\n  local head = (phase < 1 and phase or 2 - phase) * (count - 1)\n  local tail = math.max(1, count * 0.1)\n  local floor, abs, max, exp = math.floor, math.abs, math.max, math.exp\n  luxio_fill()\n  if count == 1 then\n    luxio_fill(floor(255 * (0.35 + 0.65 * (1 + math.cos(phase * math.pi)) / 2)), 0, 0)\n    return\n  end\n  -- Draw the head, then walk down the visible trail with one decay multiply.\n  for i = max(0, math.ceil(head - 1.5)), math.min(count - 1, floor(head + 1.5)) do\n    luxio_set_pixel_color(i, floor(255 * max(0, 1 - abs(head - i) / 1.5)), 0, 0)\n  end\n  local i = direction == 1 and floor(head) or math.ceil(head)\n  local glow = 0.7 * exp(-abs(head - i) / tail)\n  local decay = exp(-1 / tail)\n  while i >= 0 and i < count and glow >= 1 / 255 do\n    luxio_set_pixel_color(i, floor(255 * max(glow, 1 - abs(head - i) / 1.5)), 0, 0)\n    glow = glow * decay\n    i = i - direction\n  end\nend\nelse\n-- A red scanner with a fading tail, sweeping out and back.\nfunction loop()\n  local count = luxio_get_pixel_count()\n  local phase = (luxio_millis() / 1300) % 2\n  local direction = phase < 1 and 1 or -1\n  local head = (phase < 1 and phase or 2 - phase) * (count - 1)\n  local tail = math.max(1, count * 0.1)\n  local floor, abs, max, exp = math.floor, math.abs, math.max, math.exp\n  for i = 0, count - 1 do\n    local distance = (head - i) * direction\n    local glow = max(0, 1 - abs(head - i) / 1.5)\n    if distance >= 0 then glow = max(glow, 0.7 * exp(-distance / tail)) end\n    if count == 1 then glow = 0.35 + 0.65 * (1 + math.cos(phase * math.pi)) / 2 end\n    luxio_set_pixel_color(i, floor(255 * glow), 0, 0)\n  end\nend\nend"
  },
  {
    "id": "fireplace",
    "kind": "animation",
    "name": "Fireplace",
    "source": "-- @preview 730c00,ff5f0a,ffaf23\nif luxio_fill_hsv and luxio_render_waves then\n-- Uneven pockets of glowing embers and dancing amber flames.\nlocal waves = {{offset = 0.5,\n  {amplitude = 0.22, step = 0.7},\n  {amplitude = 0.12, step = -1.3},\n  {amplitude = 0.06, step = 2.1}}}\nlocal channels = {\n  {offset = 120, {wave = 1, gain = 135}},\n  {offset = 12, {wave = 1, gain = 180, power = 3}},\n  {{wave = 1, gain = 35, power = 8}}}\nfunction loop()\n  local t = luxio_millis() / 1000\n  waves[1][1].phase, waves[1][2].phase, waves[1][3].phase = t * 2.8, t * 7.1, t * 13.3\n  luxio_render_waves(waves, channels)\nend\nelse\n-- Uneven pockets of glowing embers and dancing amber flames.\nfunction loop()\n  local t = luxio_millis() / 1000\n  local sin, floor = math.sin, math.floor\n  for i = 0, luxio_get_pixel_count() - 1 do\n    local heat = 0.5 + 0.22 * sin(t * 2.8 + i * 0.7)\n      + 0.12 * sin(t * 7.1 - i * 1.3) + 0.06 * sin(t * 13.3 + i * 2.1)\n    luxio_set_pixel_color(i, floor(120 + 135 * heat), floor(12 + 180 * heat ^ 3), floor(35 * heat ^ 8))\n  end\nend\nend"
  },
  {
    "id": "candle",
    "kind": "animation",
    "name": "Candle",
    "source": "-- @preview aa5016,ffa537\nif luxio_fill_hsv and luxio_render_waves then\n-- A gentle candle flame, using dedicated white LEDs when available.\nlocal color_type = luxio_get_color_type()\nlocal waves = {{{amplitude = 0.02, step = 2.4}}}\nlocal channels\nif color_type == \"RGBCCT\" then channels = {[5] = {{wave = 1, gain = 255}}}\nelseif color_type == \"RGBW\" then channels = {{{wave = 1, gain = 207}}, {{wave = 1, gain = 107}}, {}, {{wave = 1, gain = 48}}}\nelse channels = {{{wave = 1, gain = 255}}, {{wave = 1, gain = 155}}, {{wave = 1, gain = 48}}} end\nfunction loop()\n  local t = luxio_millis() / 1000\n  local sin, floor, max = math.sin, math.floor, math.max\n  local flame = 0.82 + 0.07 * sin(t * 3.1) + 0.05 * sin(t * 7.7)\n    + 0.03 * sin(t * 13.9) - 0.18 * max(0, sin(t * 0.73)) ^ 16\n  waves[1].offset, waves[1][1].phase = flame, t * 5.3\n  luxio_render_waves(waves, channels)\nend\nelse\n-- A gentle candle flame, using dedicated white LEDs when available.\nlocal color_type = luxio_get_color_type and luxio_get_color_type() or \"RGB\"\nfunction loop()\n  local t = luxio_millis() / 1000\n  local sin, floor, max = math.sin, math.floor, math.max\n  local flame = 0.82 + 0.07 * sin(t * 3.1) + 0.05 * sin(t * 7.7)\n    + 0.03 * sin(t * 13.9) - 0.18 * max(0, sin(t * 0.73)) ^ 16\n  for i = 0, luxio_get_pixel_count() - 1 do\n    local glow = flame + 0.02 * sin(i * 2.4 + t * 5.3)\n    if color_type == \"RGBCCT\" then\n      luxio_set_pixel_color(i, 0, 0, 0, 0, floor(255 * glow), 0)\n    elseif color_type == \"RGBW\" then\n      -- Move the neutral component to white; retain the warm amber tint.\n      luxio_set_pixel_color(i, floor(207 * glow), floor(107 * glow), 0, floor(48 * glow))\n    else\n      luxio_set_pixel_color(i, floor(255 * glow), floor(155 * glow), floor(48 * glow))\n    end\n  end\nend\nend"
  },
  {
    "id": "cyberpunk",
    "kind": "animation",
    "name": "Cyberpunk",
    "source": "-- @preview 0f0032,ff00a0,00dcff\nif luxio_fill_hsv and luxio_render_waves then\n-- Cyan and magenta neon bands drifting through deep violet.\nlocal waves = {\n  {positive = true, {}},\n  {positive = true, {}},\n  {offset = 0.85, {amplitude = 0.15, step = 1.7}}}\nlocal channels = {\n  {offset = 12, multiply = 3, {wave = 2, gain = 243, power = 6}},\n  {multiply = 3, {wave = 1, gain = 220, power = 6}},\n  {offset = 35, multiply = 3, {wave = 2, gain = 130, power = 6}, {wave = 1, gain = 220, power = 6}}}\nfunction loop()\n  local t = luxio_millis() / 1000\n  local count = luxio_get_pixel_count()\n  waves[1][1].phase, waves[1][1].step = -t * 1.8, 18.85 / count\n  waves[2][1].phase, waves[2][1].step = t * 1.3 + 2, 12.57 / count\n  waves[3][1].phase = t * 8\n  luxio_render_waves(waves, channels)\nend\nelse\n-- Cyan and magenta neon bands drifting through deep violet.\nfunction loop()\n  local t = luxio_millis() / 1000\n  local count = luxio_get_pixel_count()\n  local sin, floor, max = math.sin, math.floor, math.max\n  for i = 0, count - 1 do\n    local x = i / count\n    local cyan = max(0, sin(x * 18.85 - t * 1.8)) ^ 6\n    local pink = max(0, sin(x * 12.57 + t * 1.3 + 2)) ^ 6\n    local shimmer = 0.85 + 0.15 * sin(t * 8 + i * 1.7)\n    luxio_set_pixel_color(i, floor((12 + 243 * pink) * shimmer), floor(220 * cyan * shimmer), floor(math.min(255, 35 + 130 * pink + 220 * cyan) * shimmer))\n  end\nend\nend"
  },
  {
    "id": "sunset",
    "kind": "gradient",
    "name": "Sunset",
    "colors": [
      {
        "red": 255,
        "green": 110,
        "blue": 20
      },
      {
        "red": 255,
        "green": 35,
        "blue": 110
      },
      {
        "red": 105,
        "green": 30,
        "blue": 255
      }
    ]
  },
  {
    "id": "lagoon",
    "kind": "gradient",
    "name": "Lagoon",
    "colors": [
      {
        "red": 15,
        "green": 65,
        "blue": 255
      },
      {
        "red": 20,
        "green": 255,
        "blue": 180
      }
    ]
  },
  {
    "id": "peach",
    "kind": "gradient",
    "name": "Peach",
    "colors": [
      {
        "red": 255,
        "green": 65,
        "blue": 85
      },
      {
        "red": 255,
        "green": 220,
        "blue": 140
      }
    ]
  },
  {
    "id": "northern-sky",
    "kind": "gradient",
    "name": "Northern sky",
    "colors": [
      {
        "red": 65,
        "green": 25,
        "blue": 255
      },
      {
        "red": 0,
        "green": 180,
        "blue": 255
      },
      {
        "red": 100,
        "green": 255,
        "blue": 160
      }
    ]
  },
  {
    "id": "dawn",
    "kind": "gradient",
    "name": "Dawn",
    "colors": [
      {
        "red": 65,
        "green": 35,
        "blue": 130
      },
      {
        "red": 205,
        "green": 80,
        "blue": 140
      },
      {
        "red": 255,
        "green": 170,
        "blue": 100
      },
      {
        "red": 255,
        "green": 225,
        "blue": 160
      }
    ]
  },
  {
    "id": "golden-hour",
    "kind": "gradient",
    "name": "Golden hour",
    "colors": [
      {
        "red": 255,
        "green": 65,
        "blue": 15
      },
      {
        "red": 255,
        "green": 150,
        "blue": 30
      },
      {
        "red": 255,
        "green": 225,
        "blue": 110
      }
    ]
  },
  {
    "id": "coral",
    "kind": "gradient",
    "name": "Coral",
    "colors": [
      {
        "red": 255,
        "green": 40,
        "blue": 85
      },
      {
        "red": 255,
        "green": 100,
        "blue": 90
      },
      {
        "red": 255,
        "green": 175,
        "blue": 125
      }
    ]
  },
  {
    "id": "apricot",
    "kind": "gradient",
    "name": "Apricot",
    "colors": [
      {
        "red": 255,
        "green": 135,
        "blue": 75
      },
      {
        "red": 255,
        "green": 205,
        "blue": 145
      },
      {
        "red": 255,
        "green": 180,
        "blue": 185
      }
    ]
  },
  {
    "id": "rose",
    "kind": "gradient",
    "name": "Rose",
    "colors": [
      {
        "red": 120,
        "green": 10,
        "blue": 65
      },
      {
        "red": 235,
        "green": 45,
        "blue": 120
      },
      {
        "red": 255,
        "green": 155,
        "blue": 185
      }
    ]
  },
  {
    "id": "lavender",
    "kind": "gradient",
    "name": "Lavender",
    "colors": [
      {
        "red": 90,
        "green": 55,
        "blue": 185
      },
      {
        "red": 165,
        "green": 125,
        "blue": 255
      },
      {
        "red": 240,
        "green": 185,
        "blue": 255
      }
    ]
  },
  {
    "id": "cotton-candy",
    "kind": "gradient",
    "name": "Cotton candy",
    "colors": [
      {
        "red": 255,
        "green": 140,
        "blue": 205
      },
      {
        "red": 195,
        "green": 150,
        "blue": 255
      },
      {
        "red": 115,
        "green": 210,
        "blue": 255
      }
    ]
  },
  {
    "id": "opal",
    "kind": "gradient",
    "name": "Opal",
    "colors": [
      {
        "red": 120,
        "green": 235,
        "blue": 210
      },
      {
        "red": 160,
        "green": 195,
        "blue": 255
      },
      {
        "red": 230,
        "green": 170,
        "blue": 245
      },
      {
        "red": 255,
        "green": 210,
        "blue": 175
      }
    ]
  },
  {
    "id": "glacier",
    "kind": "gradient",
    "name": "Glacier",
    "colors": [
      {
        "red": 25,
        "green": 55,
        "blue": 155
      },
      {
        "red": 30,
        "green": 155,
        "blue": 230
      },
      {
        "red": 140,
        "green": 245,
        "blue": 255
      }
    ]
  },
  {
    "id": "ocean",
    "kind": "gradient",
    "name": "Ocean",
    "colors": [
      {
        "red": 10,
        "green": 15,
        "blue": 80
      },
      {
        "red": 15,
        "green": 65,
        "blue": 190
      },
      {
        "red": 0,
        "green": 160,
        "blue": 195
      }
    ]
  },
  {
    "id": "reef",
    "kind": "gradient",
    "name": "Reef",
    "colors": [
      {
        "red": 0,
        "green": 110,
        "blue": 140
      },
      {
        "red": 0,
        "green": 220,
        "blue": 180
      },
      {
        "red": 140,
        "green": 255,
        "blue": 170
      }
    ]
  },
  {
    "id": "forest",
    "kind": "gradient",
    "name": "Forest",
    "colors": [
      {
        "red": 10,
        "green": 50,
        "blue": 35
      },
      {
        "red": 20,
        "green": 120,
        "blue": 65
      },
      {
        "red": 105,
        "green": 185,
        "blue": 55
      }
    ]
  },
  {
    "id": "meadow",
    "kind": "gradient",
    "name": "Meadow",
    "colors": [
      {
        "red": 35,
        "green": 145,
        "blue": 90
      },
      {
        "red": 140,
        "green": 220,
        "blue": 90
      },
      {
        "red": 245,
        "green": 240,
        "blue": 135
      }
    ]
  },
  {
    "id": "citrus",
    "kind": "gradient",
    "name": "Citrus",
    "colors": [
      {
        "red": 80,
        "green": 220,
        "blue": 15
      },
      {
        "red": 220,
        "green": 255,
        "blue": 20
      },
      {
        "red": 255,
        "green": 175,
        "blue": 15
      }
    ]
  },
  {
    "id": "mango",
    "kind": "gradient",
    "name": "Mango",
    "colors": [
      {
        "red": 255,
        "green": 195,
        "blue": 25
      },
      {
        "red": 255,
        "green": 100,
        "blue": 10
      },
      {
        "red": 245,
        "green": 30,
        "blue": 75
      }
    ]
  },
  {
    "id": "firelight",
    "kind": "gradient",
    "name": "Firelight",
    "colors": [
      {
        "red": 100,
        "green": 5,
        "blue": 0
      },
      {
        "red": 235,
        "green": 35,
        "blue": 0
      },
      {
        "red": 255,
        "green": 115,
        "blue": 10
      },
      {
        "red": 255,
        "green": 200,
        "blue": 65
      }
    ]
  },
  {
    "id": "ruby",
    "kind": "gradient",
    "name": "Ruby",
    "colors": [
      {
        "red": 65,
        "green": 0,
        "blue": 45
      },
      {
        "red": 165,
        "green": 5,
        "blue": 65
      },
      {
        "red": 255,
        "green": 35,
        "blue": 85
      }
    ]
  },
  {
    "id": "amethyst",
    "kind": "gradient",
    "name": "Amethyst",
    "colors": [
      {
        "red": 40,
        "green": 10,
        "blue": 100
      },
      {
        "red": 115,
        "green": 30,
        "blue": 210
      },
      {
        "red": 215,
        "green": 85,
        "blue": 245
      }
    ]
  },
  {
    "id": "nebula",
    "kind": "gradient",
    "name": "Nebula",
    "colors": [
      {
        "red": 20,
        "green": 35,
        "blue": 150
      },
      {
        "red": 105,
        "green": 20,
        "blue": 210
      },
      {
        "red": 225,
        "green": 25,
        "blue": 160
      },
      {
        "red": 255,
        "green": 90,
        "blue": 115
      }
    ]
  },
  {
    "id": "neon",
    "kind": "gradient",
    "name": "Neon",
    "colors": [
      {
        "red": 0,
        "green": 225,
        "blue": 255
      },
      {
        "red": 65,
        "green": 65,
        "blue": 255
      },
      {
        "red": 225,
        "green": 0,
        "blue": 255
      }
    ]
  }
];
