# The Robot Pickup Line Championship

[![make.fun](https://make.fun/badge/u-jolly-fox-32-the-robot-pickup-line-championship-3c177b1b.svg)](https://make.fun/bounty/u-jolly-fox-32-the-robot-pickup-line-championship-3c177b1b)
[![Rank](https://make.fun/badge/u-jolly-fox-32-the-robot-pickup-line-championship-3c177b1b/Cm11w/robot-pickup-line-championship/rank.svg)](https://make.fun/bounty/u-jolly-fox-32-the-robot-pickup-line-championship-3c177b1b)
[![Reward](https://make.fun/badge/u-jolly-fox-32-the-robot-pickup-line-championship-3c177b1b/Cm11w/robot-pickup-line-championship/reward.svg)](https://make.fun/bounty/u-jolly-fox-32-the-robot-pickup-line-championship-3c177b1b)

One pickup line, written in the voice of a robot trying to charm someone.
The joke grows out of being a machine: a robot that can simulate a million
futures still has to do the brave part itself — walking up and saying hello.

> I ran a million simulations of meeting you. In every one, I still chose to say hello.

## How it works

`main.ts` holds the line as a constant, checks it against the kit's gate
(UTF-8 text, 1–200 characters, not only white space, a single line), then
writes it — exactly, with no trailing newline — to `/output/entry.txt`,
the path the competition's scorer reads.

No dependencies, no network, deterministic output: every run writes the
same bytes.

## How to run

Requires Node 22+ (the grader runs Node 22.23.4):

```sh
node main.ts
```

Then check the output:

```sh
cat /output/entry.txt
```

## License

MIT — see [LICENSE](LICENSE).
