import DerivationLadder from "@/components/DerivationLadder";
import FloraSection from "@/components/FloraSection";
import HeroPlant from "@/components/HeroPlant";
import Modifying from "@/components/Modifying";
import Principles from "@/components/Principles";
import RewriteDiagram from "@/components/RewriteDiagram";
import Scene, { Fleuron, PageHead, Plate } from "@/components/Scene";
import {
  BracketPair,
  KochSequence,
  TurtleAngles,
} from "@/components/Fundamentals";
import Story from "@/components/Story";
import Tet from "@/components/Tet";
import TreeGallery from "@/components/TreeGallery";

/* The exposition follows Prusinkiewicz and Lindenmayer, The Algorithmic
   Beauty of Plants (Springer, 1990). Quoted phrasing is theirs. */

/* The alphabet is introduced a few symbols at a time, where each is first
   needed. Everything a turtle can do with a pen and nothing else. */
const ALPHABET = [
  { sym: "F", does: "Move forward a step of length d, drawing a line." },
  { sym: "f", does: "Move forward a step of length d, drawing nothing." },
  { sym: "+", does: "Turn left by the angle increment δ." },
  { sym: "−", does: "Turn right by δ." },
];

/* Added in the chapter on branches, once a single path is not enough. */
const BRACKETS = [
  { sym: "[", does: "Push the current state of the turtle onto a stack." },
  { sym: "]", does: "Pop a state, and make it the current state." },
];

export default function Page() {
  return (
    <Story>
      {/* --------------------------------------------------------- title -- */}
      <Scene id="title" label="Title">
        <Plate>
          <HeroPlant />
        </Plate>
        <div className="scene-story">
          <p className="hero-title">Digital Plant</p>
          <p className="quote">
            Organic form itself is found, mathematically speaking, to be a
            function of time. We might call the form of an organism an event in
            space-time, and not merely a configuration in space.
            <span className="attrib">D&rsquo;Arcy Thompson</span>
          </p>
        </div>
      </Scene>

      {/* ------------------------------------------------------------- note -- */}
      <Scene id="note" label="A note">
        <div className="scene-story">
          <blockquote className="note">
            <p className="note-open">Simplicity compounds.</p>
            <p>
              When I was in high school, one of the pieces of writing which
              stuck with me the most (although I never finished it) was{" "}
              <cite>A New Kind of Science</cite> by Stephen Wolfram.
            </p>
            <p>
              It argues a very simple idea, that our world and the phenomena
              around it can be described by a set of very simple rules, like
              cellular automata as you have seen in Conway&rsquo;s Game of Life,
              if you&rsquo;re familiar.
            </p>
            <p>
              In short, complexity can emerge from simplicity. And a very
              beautiful example of this is the Lindenmayer system.
            </p>
            <p>
              While formally it is used to model the behavior of plant cells,
              one can leverage the simple basis of L-systems to create
              visualizations of plants and flowers themselves.
            </p>
            <p>
              Waiting for my flight to Seoul, I used Claude to help create a
              visual interactive article on L-systems and how it can be used to
              generate the Vietnamese flora that I&rsquo;ve seen through my
              childhood.
            </p>
            <footer className="note-signature">
              <a href="https://garden.binhph.am">Binh Pham</a>
            </footer>
          </blockquote>
        </div>
      </Scene>

      {/* --------------------------------------------------- i · rewriting -- */}
      <Scene id="rewriting" label="Rewriting">
        <div className="scene-story">
          <PageHead
            title="Rewriting"
            rubric="Defining a complex object by replacing the parts of a simple one, over and over."
          />
          <p className="lead">
            The central concept is that of rewriting, a technique for defining
            complex objects by successively replacing parts of a simple initial
            object, using a set of rewriting rules called <em>productions</em>.
            A production is written <code>a → χ</code>. The single letter{" "}
            <code>a</code> on the left is its <em>predecessor</em>; the word{" "}
            <code>χ</code> on the right is its <em>successor</em>. Any letter
            for which no production has been given is assumed to carry the
            identity production <code>a → a</code>, and so stands for itself.
          </p>
          <p>
            A system needs three things, and no more: an alphabet <code>V</code>{" "}
            of the symbols allowed; a non-empty word <code>ω</code> over that
            alphabet, called the <em>axiom</em>, which is where rewriting
            begins; and a finite set of productions <code>P</code>. Where
            exactly one production exists for each letter, the system is
            deterministic, and the same axiom always yields the same plant. Give
            a letter two productions and a weight for each, and you have a
            stochastic system, which is how a species produces specimens rather
            than clones.
          </p>
          <p>
            The smallest system worth writing down has two letters and two
            productions: <code>a → ab</code> and <code>b → a</code>. Start from{" "}
            <code>b</code> and the words go <code>b</code>, <code>a</code>,{" "}
            <code>ab</code>, <code>aba</code>, <code>abaab</code>,{" "}
            <code>abaababa</code>. Count the letters and you get 1, 1, 2, 3, 5,
            8. The Fibonacci series falls out of two productions and a starting
            letter, and it is not a coincidence dressed up: every <code>a</code>{" "}
            in one word contributes an <code>a</code> and a <code>b</code> to
            the next, every <code>b</code> contributes an <code>a</code>, so the
            count of letters obeys a linear recurrence. Sunflower spirals and
            pine cone scales fall out of the same arithmetic for the same
            reason: they are counting a process that adds to itself.
          </p>
          <p>
            Lindenmayer proposed all of this in 1968, and not in order to draw
            anything. He was describing the development of a filamentous
            blue-green bacterium, <em>Anabaena catenula</em>. Its cells come in
            two sizes, written <code>a</code> and <code>b</code>, and each
            carries a polarity, written as a subscript, which decides on which
            end a daughter cell will be put. Four productions reproduce the
            sequence of long and short cells seen down a microscope, and they
            reproduce it in the right order, which is the part that matters. A
            model that got the proportions right but the sequence wrong would
            not be describing the same organism.
          </p>
          <p className="notation">
            {"ω : aᵣ\n"}
            {"aᵣ → aₗ bᵣ        aₗ → bₗ aᵣ\n"}
            {"bᵣ → aᵣ          bₗ → aₗ"}
          </p>
          <p>
            The essential difference from an ordinary grammar lies in the method
            of applying productions. In Chomsky grammars productions are applied
            sequentially, one symbol at a time, the way a compiler parses a
            line. In L-systems they are applied in parallel, and simultaneously
            replace all the letters of the word. That is not a matter of
            efficiency. Productions are intended to capture cell divisions in
            multicellular organisms, where many divisions occur at the same
            moment. If the rewriting did not happen all at once it would not be
            describing growth at all.
          </p>
        </div>

        <Plate n={2} caption="One pass of rewriting, every symbol at once.">
          <RewriteDiagram />
        </Plate>

        <div className="scene-story">
          <Fleuron />
          <p>
            The same thing can be watched geometrically. Take a square, and a
            production that replaces every side with a run of eight shorter
            ones. Two passes is already a coastline, and nothing was drawn at
            any point: each figure is the one before it with every symbol
            replaced.
          </p>
        </div>

        <Plate
          n={3}
          caption="F → F−F+F+FF−F−F+F, applied none, once and twice."
        >
          <KochSequence />
        </Plate>

        <div className="scene-story">
          <p>
            Applying the productions once yields a new word; applying them{" "}
            <em>n</em> times is a <em>derivation</em> of length <em>n</em>, and
            the whole sequence <code>ω ⇒ μ₁ ⇒ μ₂ ⇒ …</code> is called a
            developmental sequence. Each word in it is not a description of the
            organism. It is the organism, at one moment of its life.
          </p>
          <p>
            Because every letter is replaced at once, the number of each kind of
            letter in one word is a fixed linear combination of the counts in
            the word before it. That single fact settles how fast anything here
            can grow: the length of the word, and so the size of the plant, is
            always some combination of polynomials and exponentials in the
            number of passes. It is why four passes of a modest-looking rule can
            put several thousand segments on the page, and why no arrangement of
            these rules will ever produce something that grows and then quietly
            levels off. A real plant does level off. Getting that back is
            possible, but it costs more machinery than any system on these pages
            uses.
          </p>
        </div>
      </Scene>

      {/* ------------------------------------------------------ ii · turtle -- */}
      <Scene id="turtle" label="The turtle">
        <div className="scene-story">
          <PageHead
            title="The turtle"
            rubric="How a word of a few thousand letters becomes a line on paper."
          />
          <p className="lead">
            Rewriting only ever produces more text. A word of four thousand
            symbols is not yet a picture of anything, and the original theory
            had no geometry in it at all; the emphasis was on topology, on which
            cell adjoined which. Interpretations were added later. The one used
            here is turtle geometry, borrowed from Abelson and diSessa: the
            finished word is handed to a turtle, which reads it from left to
            right and leaves a trail behind it.
          </p>
          <p>
            A <em>state</em> of the turtle is a triplet (x, y, α), where the
            Cartesian coordinates (x, y) represent its position and the angle α,
            called the <em>heading</em>, is the direction in which it faces. Fix
            a step size <code>d</code> and an angle increment <code>δ</code>,
            and each letter becomes a command.
          </p>
          <p>
            Notice what the turtle does not have. It holds no map, no list of
            coordinates, no idea where it is on the page or how it got there. It
            knows one position and one heading, and every instruction it takes
            is relative to those: not <em>go to that point</em> but{" "}
            <em>turn a little and carry on</em>. That restriction is why the
            method suits plants so well. A bud has no notion of where it sits on
            the plant either. It knows which way it is pointing with respect to
            the shoot that produced it, and it grows from there.
          </p>

          <table className="legend">
            <caption>Table I. The turtle&rsquo;s alphabet</caption>
            <thead>
              <tr>
                <th scope="col">Symbol</th>
                <th scope="col">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {ALPHABET.map((row) => (
                <tr key={row.sym}>
                  <th scope="row">{row.sym}</th>
                  <td>{row.does}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Plate
          n={4}
          caption="One word, F+F+F+F+F+F+F+F+F+F, read at three angles."
        >
          <TurtleAngles />
        </Plate>

        <div className="scene-story">
          <p>
            The turtle knows nothing about plants, and nothing about rewriting.
            It is a separate machine, and that separation is the whole trick:
            the biology lives in the productions, the geometry lives here, and
            neither half needs to know anything about the other. One consequence
            is worth pausing on. The same word, read with <code>δ</code> at
            twenty degrees and at ninety, gives a shrub and a lattice. The rules
            fix what is connected to what; the turtle fixes what it looks like.
          </p>
          <p>
            One entry earns its place for a less obvious reason. <code>f</code>{" "}
            moves without drawing, which sounds like a small convenience and is
            actually what lets a figure have holes in it: an island with a lake
            inside needs the pen lifted between them, and no arrangement of
            drawn lines will do instead. Four symbols is the whole alphabet for
            now. The rest of this book adds three more, one at a time, and only
            where the drawing cannot be made without them.
          </p>
          <p>
            One practical matter. The step <code>d</code> does not shrink by
            itself, so a word twice as long draws a figure twice as big. Every
            plate here is scaled to fit its box after the fact, which is why a
            plant at five passes and the same plant at two look the same size on
            the page. Nothing about the plant changed. Only how far away you are
            standing.
          </p>
        </div>
      </Scene>

      {/* --------------------------------------------------- iii · branches -- */}
      <Scene id="branching" label="Branches">
        <div className="scene-story">
          <PageHead
            title="Branches"
            rubric="Two symbols, and a stack, are the whole of it."
          />
          <p className="lead">
            Everything so far draws a single line. It may be convoluted, it may
            cross itself, some of it may be invisible, but it remains one
            unbroken path, and the plant kingdom is dominated by branching
            structures. What is wanted is an <em>axial tree</em>: the
            graph-theoretic notion of a rooted tree, together with the
            botanically motivated notion of a branch axis. Its edges are called
            segments. A segment with more segments after it is an{" "}
            <em>internode</em>; one with nothing after it is an <em>apex</em>.
            The axis beginning at the root has order zero, and an axis branching
            off an axis of order <em>n</em> has order <em>n</em>+1.
          </p>
          <p>
            Two symbols are enough to write such a tree as a flat string.{" "}
            <code>[</code> pushes the current state of the turtle onto a
            pushdown stack: its position, its heading, and anything else it is
            carrying, such as the width of the line. <code>]</code> pops a state
            off that stack and makes it the current state. No line is drawn,
            although in general the position of the turtle changes. Whatever
            lies between the two brackets is a branch, and the stem continues
            afterwards exactly as though the branch had never happened.
          </p>
        </div>

        <div className="scene-story">
          <table className="legend">
            <caption>Table II. Two more symbols</caption>
            <thead>
              <tr>
                <th scope="col">Symbol</th>
                <th scope="col">Interpretation</th>
              </tr>
            </thead>
            <tbody>
              {BRACKETS.map((row) => (
                <tr key={row.sym}>
                  <th scope="row">{row.sym}</th>
                  <td>{row.does}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Plate
          n={5}
          caption="The same eight letters, without and with brackets."
        >
          <BracketPair />
        </Plate>

        <div className="scene-story">
          <p>
            A stack is not an arbitrary choice of machinery. A branch is a
            subtree, and to carry on the axis it grew from you must return to
            exactly the state you left, down to the heading and the width of the
            line. Last in, first out is precisely that promise. It is also what
            the plant does: a side shoot has no effect whatever on the shoot
            that bore it, which goes on extending from its own tip as though
            nothing had been added. Nest the brackets and you nest the promise,
            which is how a branch on a branch on a branch stays attached to the
            right thing.
          </p>
          <p>
            There is a second constraint hidden in these rules, and it is
            biological rather than notational. In every production here the
            symbol that keeps growing sits at the end of the successor, so new
            segments are only ever added at the tip. Botanists call that{" "}
            <em>subapical growth</em>, and every herbaceous plant does it. An
            internode that has been laid down does not lengthen again from the
            middle; the growing happens at the apex, and everything below is
            already finished. Writing the recursive letter anywhere but the end
            would describe a plant that inserts new stem into its own middle,
            which is not a plant.
          </p>
          <p>
            Because a production may place brackets inside brackets, branches
            carry branches, and the one short rule that made the first fork
            makes every fork at every scale. The resemblance to a real plant
            stops being a coincidence at this point: an apex that goes on
            producing segments below its own tip is doing what botanists call{" "}
            <em>subapical growth</em>, which is how every herbaceous plant in
            the world actually grows.
          </p>
          <p>
            This is also where the striking economy of the method shows itself.
            Alvy Ray Smith named it <em>database amplification</em>: the
            generation of complex-looking objects from very concise
            descriptions. Two productions and an angle will fill a page. The
            plant is not stored anywhere. It is recomputed, from almost nothing,
            every time you look.
          </p>
        </div>
      </Scene>

      {/* ---------------------------------------------------- iv · derivation -- */}
      <Scene id="derivation" label="Derivation">
        <DerivationLadder />
      </Scene>

      {/* --------------------------------------------------------- v · trees -- */}
      <Scene id="trees" label="Trees">
        <TreeGallery />
      </Scene>

      {/* ----------------------------------------------------- vi · modifying -- */}
      <Scene id="modifying" label="Modifying">
        <Modifying />
      </Scene>

      {/* -------------------------------------------------------- vii · growth -- */}
      <Scene id="growth" label="Growth">
        <Principles />
      </Scene>

      {/* ---------------------------------------------------------- viii · bed -- */}
      <Scene id="flora" label="A Vietnamese flora">
        <FloraSection />
      </Scene>

      {/* --------------------------------------------------------- x · tết -- */}
      <Scene id="tet" label="Tết">
        <Tet />
      </Scene>

      {/* ------------------------------------------------------------ colophon -- */}
      <Scene id="colophon" label="Colophon">
        <div className="scene-story">
          <PageHead title="Colophon" />
          <p>
            The formalism, and the phrasing of most of the exposition, is taken
            from{" "}
            <a href="https://algorithmicbotany.org/papers/abop/abop.pdf">
              <cite>The Algorithmic Beauty of Plants</cite>
            </a>{" "}
            by Przemysław Prusinkiewicz and Aristid Lindenmayer, published by
            Springer in 1990 and given away freely ever since. The four trees
            are not from the book; those rules are my own.
          </p>
          <p className="muted">
            Nothing on these pages is a photograph or an illustration. Every
            plant is derived from its rules and drawn, stroke by stroke, in your
            browser at the moment you turn to it. Turn away and back and the
            hand moves differently.
          </p>
        </div>
      </Scene>
    </Story>
  );
}
