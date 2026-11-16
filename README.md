# The Vector Mars

The Vector Mars is a terrain-aware Mars navigation planner for Jezero Crater created for the NASA Space Apps Challenge.

## Live Demo

https://sumukhprasad106-pixel.github.io/The-Vector-Mars/

## Project Presentation

[View the 7-slide project presentation](./The_Vector_Mars_7_Slides_Green_Background%202.pdf)

## Project Overview

The Vector Mars compares shortest-distance routes with terrain-aware routes between key mission locations in Jezero Crater.

The current mission points include:

- Perseverance Landing
- Western Delta
- Western Breach

The application displays:

- Route distance
- Total uphill travel
- Total downhill travel
- Maximum slope
- Terrain-aware vs shortest-distance routing
- Scientific information about each destination

## How It Works

Mars terrain data was converted into a 100 × 100 grid containing 10,000 navigation nodes.

Each node is connected to nearby nodes using a terrain graph that considers:

- Geographic distance
- Elevation change
- Slope
- Uphill travel

Dijkstra's algorithm is used to calculate both the shortest-distance route and a terrain-aware route.

The terrain-aware route adds penalties for steeper slopes and uphill movement and rejects terrain segments above the prototype slope threshold.

## NASA Data and Resources

The project uses NASA resources including:

- NASA Mars Trek
- Mars 2020 Perseverance mission information
- Jezero Crater imagery
- Mars elevation and topographic data

Mars Trek distance measurements were also used to validate the calculated route distances.

## Validation

For the route from Perseverance Landing to Western Delta:

- The Vector Mars calculated distance: 6.38 km
- NASA Mars Trek measured distance: 6.60 km
- Difference: approximately 3.4%

This comparison was used as an independent geographic validation of the routing model.

## Technologies Used

- Python — terrain processing, calibration, graph construction, and routing
- Blender — 3D terrain inspection, Python scripting, grid verification, and route visualization
- HTML — web application structure
- CSS — interface design
- JavaScript — interactive route visualization
- GitHub Pages — public deployment

## NASA Space Apps Challenge

Challenge:

**Interplanetary Survival Guide: Martian Map**

The goal of the project is to demonstrate how NASA planetary data can be transformed into a practical navigation system that helps future Mars explorers choose routes that are not only short, but also safer and more efficient.

## SI / AI Disclosure

ChatGPT was used as a development assistant for coding, debugging, troubleshooting, and writing/editing support.

The team selected the project concept, NASA data workflow, Blender grid approach, validation measurements, routing decisions, and final project implementation.
