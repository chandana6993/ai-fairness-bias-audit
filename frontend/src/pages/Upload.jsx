import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Upload as UploadIcon, FileUp, CheckCircle2, FileText, AlertCircle, XCircle } from "lucide-react";
import { uploadDataset } from "../lib/api";

export default function Upload() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) setFile(e.dataTransfer.files[0]);
  };
  const handleFileChange = (e) => { if (e.target.files?.length > 0) setFile(e.target.files[0]); };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError("");
    setResult(null);
    try {
      const data = await uploadDataset(file, (pct) => setProgress(pct));
      setResult(data);
    } catch (err) {
      setError(err.message || "Upload or audit failed. Make sure your file has a prediction column and a group column.");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setFile(null); setResult(null); setError(""); setProgress(0); };

  return (
    <div className="max-w-4xl mx-auto w-full pb-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Upload Dataset</h1>
        <p className="text-slate-500 mt-2">Upload your model's prediction CSV or JSON for real bias analysis.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8">
        {!file && !result && (
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              isDragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:bg-slate-50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" onChange={handleFileChange} className="hidden" accept=".csv,.json" ref={fileInputRef} />
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileUp className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-slate-800">Click to upload or drag and drop</h3>
            <p className="text-slate-500 text-sm max-w-sm mx-auto">CSV or JSON files. Max 50MB.</p>
          </div>
        )}

        {file && !result && (
          <div className="space-y-5">
            <div className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200">
              <FileText className="w-8 h-8 text-indigo-500 mr-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!uploading && (
                <button onClick={reset} className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5">Remove</button>
              )}
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-indigo-600">Uploading & auditing…</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-lg flex items-start gap-3">
                <XCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium">Audit Failed</h4>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {!uploading && !error && (
              <div className="flex justify-end gap-3">
                <button onClick={reset} className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors">Cancel</button>
                <button onClick={handleUpload} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2">
                  <UploadIcon className="w-4 h-4" /> Start Audit
                </button>
              </div>
            )}
          </div>
        )}

        {/* Audit Result */}
        {result && (
          <div className="space-y-6">
            <div className="bg-green-50 text-green-700 border border-green-200 p-4 rounded-lg flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium">Audit Complete!</h4>
                <p className="text-sm mt-1">{result.summary}</p>
              </div>
            </div>

            {/* Grade Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-6 text-white flex items-center gap-6">
              <div className="w-20 h-20 bg-white/15 rounded-xl flex flex-col items-center justify-center shrink-0">
                <span className="text-4xl font-black">{result.grade}</span>
                <span className="text-xs text-indigo-100 mt-1 uppercase tracking-wider">Grade</span>
              </div>
              <div>
                <p className="font-semibold text-lg">{result.dataset_name}</p>
                <p className="text-indigo-100 text-sm mt-1">{result.total_records?.toLocaleString()} records audited · Group column: <strong>{result.group_col}</strong></p>
              </div>
            </div>

            {/* Metrics list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {result.metrics && Object.entries(result.metrics).map(([k, v]) => (
                <div key={k} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    {k.replace(/_/g, " ")}
                  </p>
                  <p className={`text-2xl font-bold ${v >= 0.80 ? "text-green-600" : v >= 0.65 ? "text-amber-500" : "text-red-600"}`}>
                    {(v * 100).toFixed(1)}%
                  </p>
                  <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className={`h-1.5 rounded-full ${v >= 0.80 ? "bg-green-500" : v >= 0.65 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${Math.min(v * 100, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={reset} className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors">Upload Another</button>
              <button onClick={() => navigate("/")} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">View Dashboard</button>
            </div>
          </div>
        )}

        {/* Info section */}
        {!result && (
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-500" /> Dataset Requirements
            </h4>
            <ul className="text-sm text-slate-500 space-y-2">
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />Must have a prediction/outcome column (binary: 0/1, yes/no)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />Must have a sensitive attribute column (e.g. gender, race, age_group)</li>
              <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />Optional: a true label/ground truth column for full metric calculations</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
