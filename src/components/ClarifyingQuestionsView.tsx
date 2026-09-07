import React, { useState } from 'react';
import { 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  ShieldCheck, 
  Scale, 
  Info,
  Clock,
  Sparkles,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { ClarifyingQuestion, FormulaPresetId } from '../types';

interface ClarifyingQuestionsViewProps {
  questions: ClarifyingQuestion[];
  onResolveQuestion: (questionId: string, optionId: string, actionValue: any) => void;
  onResetQuestions?: () => void;
  currency?: string;
}

export const ClarifyingQuestionsView: React.FC<ClarifyingQuestionsViewProps> = ({
  questions,
  onResolveQuestion,
  onResetQuestions,
  currency = 'EUR'
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'resolved'>('all');

  const pendingCount = questions.filter(q => q.status === 'pending').length;
  const resolvedCount = questions.filter(q => q.status === 'resolved').length;

  const filteredQuestions = questions.filter(q => {
    if (activeFilter === 'pending') return q.status === 'pending';
    if (activeFilter === 'resolved') return q.status === 'resolved';
    return true;
  });

  const getCategoryBadge = (category: ClarifyingQuestion['category']) => {
    switch (category) {
      case 'Duplicate Resolution':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Date Chronology':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SLA & Credit Memo':
        return 'bg-[#FDF2F3] text-[#8A212B] border-[#FCA5A5]';
      case 'Contract Term Duration':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Fee Discrepancy':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Banner */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#8A212B] text-white flex items-center justify-center shrink-0 shadow-xs">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Data Cleanliness & Precision Clarification Engine
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                pendingCount > 0 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {pendingCount > 0 ? `${pendingCount} Questions Pending` : 'All Questions Verified'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              To ensure customer Beta Industries is charged with absolute precision, the engine detects ambiguities (duplicate entries, date format inversions, SLA credit eligibility, and contract durations) and requests your authoritative decision.
            </p>
          </div>
        </div>

        {/* Filter & Reset Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({questions.length})
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'pending' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setActiveFilter('resolved')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'resolved' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Verified ({resolvedCount})
            </button>
          </div>

          {onResetQuestions && (
            <button
              onClick={onResetQuestions}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs transition-colors"
              title="Reset all questions to default recommendations"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">No Clarifying Questions in This View</p>
            <p className="text-xs text-slate-500 mt-1">All data cleanliness and accuracy questions have been verified.</p>
          </div>
        ) : (
          filteredQuestions.map((q) => {
            const isResolved = q.status === 'resolved';

            return (
              <div 
                key={q.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isResolved 
                    ? 'bg-slate-50/70 border-slate-200' 
                    : 'bg-white border-[#FCA5A5] shadow-sm ring-1 ring-[#8A212B]/10'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${getCategoryBadge(q.category)}`}>
                      {q.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isResolved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isResolved ? 'Verified & Applied' : 'Decision Required'}
                    </span>
                  </div>

                  {isResolved && q.resolvedAction && (
                    <div className="text-right">
                      <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Active: <strong>{q.resolvedAction}</strong></span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Question & Context */}
                <div className="mt-3.5 space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 leading-snug">
                    {q.question}
                  </h4>
                  
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-700">Audit Context: </span>
                    {q.context}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-900">
                      <span className="font-bold text-[11px] uppercase tracking-wider block mb-0.5">Billing Precision Impact:</span>
                      <span>{q.impactOnBilling}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-emerald-900">
                      <span className="font-bold text-[11px] uppercase tracking-wider block mb-0.5">Recommended Standard:</span>
                      <span>{q.recommendedAction}</span>
                    </div>
                  </div>
                </div>

                {/* Actionable Decision Options */}
                {q.options && q.options.length > 0 && (
                  <div className="mt-4 pt-3.5 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-2">
                      Select Authoritative Resolution:
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt) => {
                        const isChosen = q.resolvedAction === opt.label;

                        return (
                          <button
                            key={opt.id}
                            onClick={() => onResolveQuestion(q.id, opt.id, opt.actionValue)}
                            className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                              isChosen 
                                ? 'bg-[#FDF2F3] border-[#8A212B] ring-2 ring-[#8A212B]/20 shadow-xs' 
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className={`text-xs font-bold ${isChosen ? 'text-[#8A212B]' : 'text-slate-800'}`}>
                                {opt.label}
                              </span>
                              {isChosen && (
                                <span className="w-2 h-2 rounded-full bg-[#8A212B] shrink-0 mt-1"></span>
                              )}
                            </div>

                            {opt.financialEffect && (
                              <span className="text-[11px] text-slate-500 mt-1.5 font-mono">
                                {opt.financialEffect}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
