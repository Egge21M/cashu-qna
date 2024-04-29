import { FormEvent, useRef, useState } from "react";
import {
  EventTemplate,
  SimplePool,
  finalizeEvent,
  generateSecretKey,
  nip04,
} from "nostr-tools";

const eggePubkey =
  "ddf03aca85ade039e6742d5bef3df352df199d0d31e22b9858e7eda85cb3bbbe";

const pool = new SimplePool();

const relays = [
  "wss://relay.damus.io",
  "wss://nostr.bitcoiner.social",
  "wss://relay.current.fyi",
  "wss://nostr.einundzwanzig.space",
  "wss://nostr-pub.wellorder.net",
];

function App() {
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const partRef = useRef<HTMLSelectElement>(null);
  const questionsRef = useRef<HTMLTextAreaElement>(null);

  async function sendForm(e: FormEvent) {
    setError("");
    e.preventDefault();
    if (!partRef.current || !partRef.current.value) {
      setError("Bitte fülle die erforderlichen Felder aus");
      return;
    }
    const sk = generateSecretKey();
    const info = JSON.stringify({
      name: nameRef.current?.value || "anonym",
      participating: partRef.current?.value,
      questions: questionsRef.current?.value,
    });
    const msg = await nip04.encrypt(sk, eggePubkey, info);
    const eventTemplate: EventTemplate = {
      kind: 4,
      created_at: Math.floor(Date.now() / 1000),
      content: msg,
      tags: [["p", eggePubkey]],
    };
    const signedEvent = finalizeEvent(eventTemplate, sk);
    const pubs = pool.publish(relays, signedEvent);
    await new Promise((res, rej) => {
      const timer = setTimeout(() => {
        rej("Could not send response...");
      }, 3000);
      pubs.map((p) =>
        p
          .then(() => {
            clearTimeout(timer);
            res("success");
          })
          .catch((e) => console.log(e)),
      );
    })
      .then(() => {
        setDone(true);
      })
      .catch((err) => {
        setError(err);
      });
  }
  return (
    <div className="inset-0 absolute flex flex-col justify-center items-center">
      <h1 className="mb-12 max-w-lg text-center">
        Zitadelle 24 - Cashu Workshop
      </h1>
      <form onSubmit={sendForm} className="flex flex-col gap-4 w-72">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-xs text-left">
            Name (optional)
          </label>
          <input type="text" id="name" className="p-2 rounded" ref={nameRef} />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-xs text-left">
            Nimmst du an dem Workshop teil?
          </label>
          <select name="part" required ref={partRef} className="p-2 rounded">
            <option>Ja</option>
            <option>Nein</option>
            <option>Vielleicht</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-xs text-left">
            Deine Fragen (optional)
          </label>
          <textarea ref={questionsRef} className="p-2 rounded" />
        </div>
        <button disabled={done} className="disabled:text-zinc-700">
          Submit
        </button>
      </form>
      {error ? <p className="mt-8 text-red-600">{error}</p> : undefined}
      {done ? (
        <p className="mt-8 text-green-600">Danke fürs mitmachen!</p>
      ) : undefined}
      <p className="text-zinc-600 text-xs max-w-lg m-8">
        Neben den Informationen die du in dem Formular angibst, sammelt diese
        Website keinerlei Daten. Die Übermittlung findest anonym und
        verschlüsselt über nostr statt. Den Quellcode für diese Website findest
        du hier:{" "}
        <a href="https://github.com/Egge21M/cashu-qna" target="_blank">
          GitHub
        </a>
      </p>
    </div>
  );
}

export default App;
