- No user interaction with simulation logic.
+- Users have the ability to send messages as "GOD" (an omniscient entity) to all or selected agents.
  - GOD messages are delivered to agents as special events and are logged in the event log.
  - The UI provides a panel or input for composing and sending GOD messages, with options to target all agents or specific individuals/groups.
  - Agents may react to GOD messages according to their logic and memory.
# Island Survival Simulator: System Design Document

## Overview
A research-focused island survival simulator where AI agents, powered by SOTA LLMs with tool-calling, interact in a traceable, replayable environment. The simulation is server-driven, with a client for visualization only. All agent actions, world changes, and events are fully logged for research and analysis.

---




## Configuration
- All key simulation values are user-configurable via a config file, including:
  - Child duration (ticks/days to adulthood)
  - Pregnancy duration
  - Crop growth time and watering requirements
  - Agent movement per tick
  - Meals required per day
  - Map size
  - And other relevant parameters


### 1. Simulation Tick & Time System
- Each tick = 1 hour of simulation time.
- Day/night cycle (e.g., 6:00–18:00 is day, 18:00–6:00 is night).
- All time-based mechanics (pregnancy, childhood, etc.) use this granularity.

Agents have:
  - Name (unique, visible in UI and logs)
  - Gender (male, female)
  - Age (numeric, in ticks or hours)
  - Status (child/adult/elder, derived from age thresholds)
  - Movement: Agents can move up to a configurable number of tiles per tick (default: 1).
  - Happiness (tracked and updated based on needs, relationships, events, etc.)
  - Memories (recent events, chats, actions)
  - Relationships (trust, friendship, rivalry, etc.)
  - Inventory (resources: wood, stone, water, food, tools)
  - Alive/dead status
  - Relationships (trust, friendship, rivalry, etc.)
  - Inventory (resources: wood, stone, water, food, tools)
  - Alive/dead status
- Children: Limited to communication and movement for a configurable number of ticks (default: 2160 ticks, 90 days, ~3 months).
- Adults: Full action set (craft, gather, build, procreate, give, etc.).

**Crop Field Creation & Growth:**
- Tools can be used by agents to create crop fields on suitable terrain.
- Crop fields enable agents to grow food resources over time, supporting sustainable food supply.

**Crop Growth & Harvest:**
- Fields take a configurable number of ticks to mature after planting (default: 72 ticks, 3 days).
- Each field must be watered by an agent or receive rain a configurable number of times during the growth period to mature (default: 3).
- If the watering requirement is not met, the crop fails to mature and cannot be harvested.
- Once mature and watered sufficiently, agents can harvest the field to obtain food resources.
### Weather System
- The world features a weather system with at least two states: rain and sun.
- Weather state changes at defined intervals or randomly, and is logged as an event.
- Rain events water all crop fields on the island.
- Weather state is visible in the UI and included in the event log.

**Nutrition Requirement:**
- All agents must eat at least a configurable number of meals (default: 3) per day (every 24 ticks).
- If an agent eats less than the configured number of meals in a 24-tick period, they enter a starving state, which increases risk of death and may affect happiness and performance.

### 3. Procreation & Pregnancy
- Procreation only possible between exactly two agents: one male, one female, in proximity.
- On success:
  - Female receives a pregnancy modifier for a configurable number of ticks (default: 216 ticks, 9 days).
  - Pregnancy increases hunger/thirst needs during this period.
  - After the configured duration, a child agent is born.
- Pregnancy events (start/end) are logged.

### 4. Child Growth
- New agents are children for 168 ticks (1 week).
- After 168 ticks, they become adults and gain full capabilities.
- Growth transition is logged.

- All actions are performed exclusively through tool calls (OpenAI-compatible function calling/tool use).
  - Agents can only act on or interact with entities (agents, resources, terrain) within their proximity visibility radius.
- All actions are performed exclusively through tool calls (OpenAI-compatible function calling/tool use).
- One action per agent per tick.
- Action set includes: move, communicate (proximity chat), craft, gather, build, procreate, give resources.
- Children: Only move and communicate (via tool calls).
- Adults: All actions (via tool calls).

- Agents can communicate with others within their proximity visibility radius.
- Chats are logged and can influence memory/relationships.

### 7. Resource Transfer
- Agents can give resources (wood, stone, water, food, tools) to others in proximity.
- Server validates and updates inventories.
- Transfers are logged and visualized.

- Agents die if needs (hunger, thirst, temperature, etc.) are unmet, by other defined conditions, or due to old age (elder agents have a risk of dying each tick).
- Starvation occurs if an agent fails to eat at least 2 meals in a 24-tick period; prolonged starvation leads to death.
- On death:
  - Agent is removed from active simulation.
  - All resources in inventory are dropped at their location.
  - Death and resource drop events are logged.
  - Dead agents cannot act or be targeted.

- The entire simulation is fully traceable, with a git-like event log:
  ...existing code...
  - The system supports full playback of the simulation:
    - Users can step through, play, pause, jump to any event, or branch from any point in the event chain.
    - Playback controls are available in the GUI for researcher analysis and demonstration.
- The entire simulation is fully traceable, with a git-like event log:
  - Every event (action, state change, message, etc.) is recorded as a node in a chain, each referencing its predecessor (parent event).
  - This enables full reconstruction of the simulation history, supports branching (alternate timelines), and allows replay, pause, resume, and timeline navigation.
  - The event log includes all tool calls, LLM prompts/responses, chats, births, deaths, resource drops, state changes, and GOD messages, each linked to the previous event.
  - Researchers can view or export the full chain of events for analysis or reproducibility.


- The world is a single island.
- Terrain is generated using Perlin noise for realistic elevation, coastline, and resource distribution.
- The island shape is enforced by applying a radial mask to the Perlin noise output, ensuring a central landmass surrounded by water.
- Terrain features (e.g., beaches, forests, rocky areas, water sources) are distributed based on elevation and noise values.
- Resource placement (wood, stone, water, food) is influenced by terrain type and realism.
+- The map is a 50x50 grid by default, but can be made larger based on user configuration.
- The world is a single island.
- Terrain is generated using Perlin noise for realistic elevation, coastline, and resource distribution.
- The island shape is enforced by applying a radial mask to the Perlin noise output, ensuring a central landmass surrounded by water.
- Terrain features (e.g., beaches, forests, rocky areas, water sources) are distributed based on elevation and noise values.
- Resource placement (wood, stone, water, food) is influenced by terrain type and realism.

- Visualizes world (island terrain), agents, inventories, and timeline using pixel art for all graphical elements.
- The GUI is designed to be modern, clean, and visually appealing, with clear layouts, smooth animations, and modern UI/UX best practices.
- UI Layout:
  - The map is displayed on the left side of the screen.
  - Agent stats and details are shown in a panel at the bottom right.
  - Ongoing tool actions (current actions being performed by agents) are displayed in a panel at the top right.
  - Users can filter and highlight different categories (e.g., by agent, resource, action type, status) for focused analysis.
- The interface must present all necessary information for researchers monitoring the environment, including agent states, world status, event logs, and key metrics, in an accessible and organized manner.
- Shows agent details (status, memory, relationships, inventory, pregnancy, etc.).
- Displays event log and provides playback controls (step, play, pause, jump, branch) for reviewing the simulation timeline.
- No user interaction with simulation logic.

- Server orchestrates simulation by sending state and tool schemas to an OpenAI-compatible endpoint.
- LLM prompts must be efficient, concise, and context-aware, including only the necessary information for the agent's decision-making each tick.
- Users can configure endpoint, model, and API key.
- LLM responds with structured tool calls, which the server validates and applies.
- All LLM interactions are logged.

---

- Agent: id, name, gender, age (numeric), status (child/adult), happiness, memory, relationships, inventory (wood, stone, water, food, tools), alive/dead, pregnancy, location, visibility_radius
- Event: type, agents involved, tick/time, details (e.g., resources, chat, tool call, etc.)
- World: map (2D grid with Perlin noise-based elevation, terrain type, and radial mask for island shape), resources (wood, stone, water, food), dropped items, time, day/night status
- Tool schemas: move, communicate, craft, gather, build, procreate, give, create_crop_field, etc.

---

## Verification Checklist
- [ ] Each tick = 1 hour; day/night cycle works
- [ ] Agents have correct status, memory, relationships, inventory
- [ ] Procreation, pregnancy, and child growth follow rules
- [ ] Children limited to move/communicate; adults have full actions
- [ ] Resource transfer and proximity chat work
- [ ] Death and resource drop mechanics function
- [ ] All events are logged and visualized
- [ ] LLM integration is configurable and auditable

---

## Extensibility
- Add new agent needs, actions, or world features as research requires
- Adjust time-based mechanics (pregnancy, childhood, etc.)
- Expand event log and visualization as needed

---

## Notes
- All logic is server-side; client is visualization only
- No user interaction with simulation logic
- All state changes are fully traceable and replayable
