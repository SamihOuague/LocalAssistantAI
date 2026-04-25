import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router";
import ws from "../lib/WebSocketManager";


type DocumentItem = {
  id: string;
  name: string;
  type: "pdf" | "docx";
  createdAt: string;
};

type DocType = "contract" | "letter" | "invoice";

export function DashboardPage() {
  const documents = [
    { id: "1", name: "Contrat prestation", type: "pdf", createdAt: "2026-04-23" },
    { id: "2", name: "Lettre mise en demeure", type: "docx", createdAt: "2026-04-22" },
  ];
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<DocType | "">("");
  const [form, setForm] = useState<any>({});
  const [message, setMessage] = useState<any>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // ouvre la connexion unique
    const token = localStorage.getItem("token") || "";
    ws.connect(token);

    // écoute les messages du backend
    const unsubscribe = ws.subscribe((data) => {
      setIsLoading(true);

      if (data.status === "answer") {
        setMessage({
            role: "assistant",
            content: data.chunk,
          });
      }

      if (data.status === "finished") {
        setIsLoading(false);
      }
    });

    // nettoyage quand le component se démonte
    return () => {
      unsubscribe();
    };
  }, []);

  const updateForm = (key: string, value: string) => {
    console.log(key, value);
    setForm((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const submit = useCallback(() => {
    
    if (!type) {
      console.log("Aucun type de document sélectionné");
      return;
    }

    const payload = {
      type,
      ...form,
    };

    ws.send({messages: [{ role: "user", content: JSON.stringify(payload) }], think: true});
    setOpen(false);
    setType("");
    setForm({});
  }, [type, form]);

  return (
    <div className="flex h-screen bg-[#0b1220] text-white">

      {/* SIDEBAR */}
      <aside className="w-72 bg-[#0f172a] border-r border-white/10 p-4 flex flex-col gap-6">
        <div className="p-5 border-b border-white/10">
          <div className="text-lg font-semibold">⚖️ Assistant IA</div>
          <div className="text-xs text-white/40">Assistant entreprise</div>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <Link className="hover:bg-white/10 p-2 rounded-lg" to="/chat">
            Chat IA
          </Link>
          <Link className="hover:bg-white/10 p-2 rounded-lg" to="/documents">
            Documents
          </Link>
          <Link className="hover:bg-white/10 p-2 rounded-lg" to="/settings">
            Settings
          </Link>
        </nav>

        <div className="mt-auto text-xs text-white/40">
          v1.0 local enterprise
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col">

        {/* TOPBAR */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-[#111827]">
          <h1 className="font-medium">Dashboard</h1>

          <button
            onClick={() => setOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm transition"
          >
            📄 Générer document
          </button>
        </header>

        {/* CONTENT */}
        <main className="p-6 space-y-6 overflow-y-auto">

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-sm text-white/50">Documents</div>
              <div className="text-3xl font-bold">{documents.length}</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-sm text-white/50">Chats</div>
              <div className="text-3xl font-bold">8</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="text-sm text-white/50">Utilisateurs</div>
              <div className="text-3xl font-bold">1</div>
            </div>

          </div>

          {/* DOCUMENTS */}
          <div>
            <h2 className="text-sm text-white/60 mb-3">Derniers documents</h2>

            <div className="grid md:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition"
                >
                  <div className="font-medium">{doc.name}</div>
                  <div className="text-xs text-white/40">{doc.createdAt}</div>

                  <div className="flex gap-2 mt-3">
                    <a className="text-xs bg-red-500/80 px-3 py-1 rounded-lg">
                      PDF
                    </a>
                    <a className="text-xs bg-blue-500/80 px-3 py-1 rounded-lg">
                      DOCX
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>

      {/* MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">

          <div className="bg-[#111827] w-[520px] rounded-2xl p-6 border border-white/10">

            <h2 className="text-lg font-semibold mb-4">
              Génération de document
            </h2>

            {/* TYPE */}
            <label className="text-sm text-white/60">
              Type de document
            </label>

            <select
              className="w-full mt-1 p-2 rounded bg-black/40 border border-white/10"
              onChange={(e) => setType(e.target.value as DocType)}
            >
              <option value="">Choisir...</option>
              <option value="contract">Contrat</option>
              <option value="letter">Lettre</option>
              <option value="invoice">Devis / Facture</option>
            </select>

            {/* FORMULAIRE */}
            {type && (
              <div className="mt-4 space-y-3">

                <input
                  placeholder="Titre du document"
                  className="w-full p-2 rounded bg-black/40 border border-white/10"
                  onChange={(e) => updateForm("title", e.target.value)}
                />

                <input
                  placeholder="Nom du client"
                  className="w-full p-2 rounded bg-black/40 border border-white/10"
                  onChange={(e) => updateForm("client", e.target.value)}
                />

                <input
                  placeholder="Entreprise"
                  className="w-full p-2 rounded bg-black/40 border border-white/10"
                  onChange={(e) => updateForm("company", e.target.value)}
                />

                <textarea
                  placeholder="Contexte juridique / instructions"
                  className="w-full p-2 rounded bg-black/40 border border-white/10"
                  onChange={(e) => updateForm("details", e.target.value)}
                />

                {type === "invoice" && (
                  <input
                    placeholder="Montant (€)"
                    className="w-full p-2 rounded bg-black/40 border border-white/10"
                    onChange={(e) => updateForm("amount", e.target.value)}
                  />
                )}
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded bg-white/10"
              >
                Annuler
              </button>

              <button
                onClick={submit}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700"
              >
                Générer
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}