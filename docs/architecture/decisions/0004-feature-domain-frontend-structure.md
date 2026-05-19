# Feature Domain Frontend Structure

We will organize frontend product code by feature/domain instead of generic technical layers. Crypto market browsing, simulation, purchasing power, auth, and shared UI/utilities should each have clear homes so related screens, hooks, validators, clients, and tests stay close to the product job they support.

This trades a little upfront folder design for better local reasoning: when a junior engineer works on simulation, they should mostly live inside the simulation feature folder instead of jumping across global `components`, `hooks`, `services`, and `validators` directories.
