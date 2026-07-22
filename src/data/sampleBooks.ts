import { SampleBook } from '../types';

export const SAMPLE_BOOKS: SampleBook[] = [
  {
    id: 'art-of-war',
    title: 'The Art of War',
    author: 'Sun Tzu',
    category: 'Strategy & Philosophy',
    description: 'An ancient Chinese military treatise dating from the Late Spring and Autumn Period.',
    coverBg: 'from-amber-700 to-red-900',
    sampleText: `Chapter 1: Laying Plans
Sun Tzu said: The art of war is of vital importance to the State. It is a matter of life and death, a road either to safety or to ruin. Hence it is a subject of inquiry which can on no account be neglected.
The art of war, then, is governed by five constant factors, all to be taken into account in one's deliberations, when seeking to determine the conditions obtaining in the field. These are: The Moral Law, Heaven, Earth, The Commander, Method and discipline.

Chapter 2: Waging War
Sun Tzu said: In the operations of war, where there are in the field a thousand swift chariots, as many heavy chariots, and a hundred thousand mail-clad soldiers, with provisions enough to carry them a thousand li, the expenditure at home and at the front, including the entertainment of guests, small items such as glue and paint, and sums spent on chariots and armor, will reach the total of a thousand ounces of silver per day. Such is the cost of raising an army of 100,000 men.
When you engage in actual fighting, if victory is long in coming, then men's weapons will grow dull and their ardor will be damped. If you lay siege to a town, you will exhaust your strength.`
  },
  {
    id: 'alice-wonderland',
    title: "Alice's Adventures in Wonderland",
    author: 'Lewis Carroll',
    category: 'Classic Fiction',
    description: 'A whimsical tale of a girl named Alice who falls down a rabbit hole into a fantasy world.',
    coverBg: 'from-blue-600 to-indigo-900',
    sampleText: `Chapter 1: Down the Rabbit-Hole
Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, "and what is the use of a book," thought Alice "without pictures or conversations?"
So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a White Rabbit with pink eyes ran close by her.
There was nothing so VERY remarkable in that; nor did Alice think it so VERY much out of the way to hear the Rabbit say to itself, "Oh dear! Oh dear! I shall be late!"

Chapter 2: The Pool of Tears
"Curiouser and curiouser!" cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); "now I'm opening out like the largest telescope that ever was! Good-bye, feet!"`
  },
  {
    id: 'ai-research-paper',
    title: 'Generative AI & Audio Cognition',
    author: 'Dr. Elena Vance et al.',
    category: 'Science & Technology',
    description: 'A research summary on neural speech synthesis and cognitive retention in audiobooks.',
    coverBg: 'from-emerald-700 to-teal-950',
    sampleText: `Abstract & Introduction: Neural Audio Processing
In recent years, deep neural voice synthesis has transformed audio document comprehension. Studies demonstrate that structured speech audio narration increases listener retention by up to 38% compared to unformatted raw optical text reading.
This paper examines the transformation of technical PDF layout documents—including dense multi-column tables, mathematical citations, and figures—into clear, continuous auditory narratives.

Section 1: The Speech Architecture
Converting arbitrary layout documents into human-like spoken audiobooks requires three core operations:
1. Structural Layout Extraction: Isolating headings, main paragraphs, and suppressing repetitive headers or running footers.
2. Natural Prose Transformation: Rewriting dense abbreviations, equations, and visual diagrams into expressive prose.
3. Expressive Acoustic Synthesis: Applying prosodic phrasing, pause timing, and acoustic emphasis across chapter bounds.`
  }
];
