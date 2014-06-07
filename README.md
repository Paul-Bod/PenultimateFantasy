PenultimateFantasy
==================

Creating a Final Fantasy inspired game in JavaScript

TODO
=====

REFACTORS

- Move things into Utils. E.g. getCharacterIndex
- achievements to model
- Menu messages to store with menu
- Consider a MessageBrokerController.js which is centrally in charge of managing messages….
- moves targeting a configurable number of targets
- First loss message
- magical message when already at max mp
- lifeorb message when already alive

- review experience relating to level
- upgrade hp/mp (vitality/spirit)
- restart activity gauge on back?
- accuracy
- evasion
- on death earn undefined dollars
- on death 0 experience!

NEW FEATURES

- status ailments
- additional classes
- momentum

STATUS AILMENTS / EFFECTS

1. applying a function several times over a number of goes i.e. poison
2. applying a function once on casting for effect, and a second function some goes later to remove effect i.e. protect
3. functions applied once to remove active effects i.e. despell
4. a function who's effect lasts either the whole battle or until removed by 3
5. effects that stack and those that override? IE silence and poison stack but haste and slow override


WARRIOR

- Gains by doing attack.
- Spends on class-specific skills
- Each skill costs x momentum

BLACK MAGE

- Gains by doing black magic
- class-specific skills are listed with regular magic
- On select target, magic is charged up by holding down mouse button which depletes momentum.
- Momentum spent on charging boosts power of spell

WHITE MAGE

- Gains by doing white magic
- Class-specific skills are listed with regular magic
- When momentum bar is half full, each spell can select two targets
- When momentum bar is full, each spell can select three targets

THIEF

- Gains by stealing
- Class-specific skills involve turning monsters into useful things like gold
- Monster HP and thief momentum when using skill determines how good the item is

ALCHEMIST

- Gains by using item
- Class-specific skills are creating base items and using alchemist only special items
- Each item requires an amount of momentum to create
- Each special item requires an amount of momentum and several base items to use

BEAST

- Gains by taking damage
- Class-specific skills are lots of passive stat boosters
- select a number of these to be active
- Boost effect is greater with more momentum
- momentum is depleted by attacking
