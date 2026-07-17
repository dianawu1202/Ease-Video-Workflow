/**
 * ChatPanel.tsx
 *
 * Right-side director assistant powered by the server-side chat agent.
 * Supports canvas context, chat history, and drag/drop media references.
 */

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, History, Loader2, MessageSquare, Plus, Send, Sparkles, Trash2, X } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatCanvasContext, ChatMessage as ChatMessageType, ChatSession, useChatAgent } from '../hooks/useChatAgent';
import { NodeData, NodeType } from '../types';

interface AttachedMedia {
    type: 'image' | 'video';
    url: string;
    nodeId: string;
    base64?: string;
}

interface ChatPanelProps {
    isOpen: boolean;
    onClose: () => void;
    userName?: string;
    isDraggingNode?: boolean;
    onNodeDrop?: (nodeId: string, url: string, type: 'image' | 'video') => void;
    canvasTheme?: 'dark' | 'light';
    nodes?: NodeData[];
    selectedNodeIds?: string[];
}

interface ChatBubbleProps {
    onClick: () => void;
    isOpen: boolean;
}

const COPY = {
    assistantTitle: '\u5bfc\u6f14\u52a9\u624b',
    newChat: '\u65b0\u5bf9\u8bdd',
    history: '\u5bf9\u8bdd\u5386\u53f2',
    noHistory: '\u8fd8\u6ca1\u6709\u5bf9\u8bdd\u5386\u53f2',
    historyHint: '\u5f00\u59cb\u8ba8\u8bba\u5267\u60c5\u540e\u4f1a\u51fa\u73b0\u5728\u8fd9\u91cc',
    dropReference: '\u62d6\u5165\u53c2\u8003\u7d20\u6750',
    greeting: '\u4eca\u5929\u62cd\u4ec0\u4e48\u6545\u4e8b\uff1f',
    contextTip: '\u9009\u4e2d\u753b\u5e03\u8282\u70b9\u540e\u76f4\u63a5\u63d0\u95ee\uff0c\u6211\u4f1a\u7ed3\u5408\u5f53\u524d\u5267\u60c5\u3001\u5206\u955c\u3001\u56fe\u7247\u6216\u89c6\u9891\u8282\u70b9\u7ed9\u51fa\u5bfc\u6f14\u5efa\u8bae\u3002',
    collapse: '\u6536\u8d77',
    removeReference: '\u79fb\u9664\u53c2\u8003',
    placeholder: '\u548c\u5bfc\u6f14\u52a9\u624b\u8ba8\u8bba\u5267\u60c5\u3001\u5206\u955c\u3001\u8fd0\u955c\u6216\u63d0\u793a\u8bcd',
    canvasAware: '\u5df2\u611f\u77e5\u5f53\u524d\u753b\u5e03',
    selectedAwarePrefix: '\u5df2\u611f\u77e5',
    selectedAwareSuffix: '\u4e2a\u9009\u4e2d\u8282\u70b9',
    messages: '\u6761\u6d88\u606f',
    yesterday: '\u6628\u5929',
    daysAgo: '\u5929\u524d',
    deleteChat: '\u5220\u9664\u5bf9\u8bdd',
};

const SUGGESTIONS = [
    '\u6da6\u8272\u5267\u60c5',
    '\u62c6\u5206\u5206\u955c',
    '\u8bbe\u8ba1\u8fd0\u955c',
    '\u4f18\u5316\u63d0\u793a\u8bcd',
];

function summarizeNode(node: NodeData) {
    return {
        id: node.id,
        type: node.type,
        title: node.title || node.type,
        prompt: node.prompt,
        status: node.status,
        hasResult: Boolean(node.resultUrl),
        parentIds: node.parentIds,
    };
}

async function imageUrlToBase64(url: string): Promise<string | undefined> {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1] || result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('Failed to convert image to base64:', error);
        return undefined;
    }
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
    isOpen,
    onClose,
    userName = 'Creator',
    isDraggingNode = false,
    onNodeDrop,
    canvasTheme = 'dark',
    nodes = [],
    selectedNodeIds = [],
}) => {
    const [message, setMessage] = useState('');
    const [showTip, setShowTip] = useState(true);
    const [attachedMedia, setAttachedMedia] = useState<AttachedMedia[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const isDark = canvasTheme === 'dark';
    const {
        messages,
        topic,
        isLoading,
        error,
        sessions,
        isLoadingSessions,
        sendMessage,
        startNewChat,
        loadSession,
        deleteSession,
        hasMessages,
    } = useChatAgent();

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const buildCanvasContext = (): ChatCanvasContext | undefined => {
        if (!nodes.length) return undefined;

        const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
        const fallbackNodes = nodes.slice(-8);

        return {
            totals: {
                totalNodes: nodes.length,
                selectedNodes: selectedNodes.length,
                imageNodes: nodes.filter(node => node.type === NodeType.IMAGE).length,
                videoNodes: nodes.filter(node => node.type === NodeType.VIDEO).length,
                textNodes: nodes.filter(node => node.type === NodeType.TEXT).length,
            },
            selectedNodes: selectedNodes.map(summarizeNode),
            recentNodes: selectedNodes.length ? [] : fallbackNodes.map(summarizeNode),
        };
    };

    const handleDragEnter = (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
    };

    const handleDrop = async (event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);

        const nodeData = event.dataTransfer.getData('application/json');
        if (!nodeData) return;

        try {
            const { nodeId, url, type } = JSON.parse(nodeData);
            if (!url || (type !== 'image' && type !== 'video')) return;

            const base64 = type === 'image' ? await imageUrlToBase64(url) : undefined;
            setAttachedMedia(prev => {
                if (prev.some(media => media.nodeId === nodeId)) return prev;
                return [...prev, { type, url, nodeId, base64 }];
            });
            onNodeDrop?.(nodeId, url, type);
        } catch (error) {
            console.error('Failed to parse dropped node data:', error);
        }
    };

    const removeAttachment = (nodeId: string) => {
        setAttachedMedia(prev => prev.filter(media => media.nodeId !== nodeId));
    };

    const handleSend = async () => {
        if ((!message.trim() && attachedMedia.length === 0) || isLoading) return;

        const currentMessage = message;
        const currentMedia = attachedMedia;
        const currentCanvasContext = buildCanvasContext();

        setMessage('');
        setAttachedMedia([]);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        setShowTip(false);

        await sendMessage(
            currentMessage,
            currentMedia.length > 0 ? currentMedia.map(media => ({
                type: media.type,
                url: media.url,
                base64: media.base64,
            })) : undefined,
            currentCanvasContext
        );
    };

    const handleNewChat = () => {
        startNewChat();
        setMessage('');
        setAttachedMedia([]);
        setShowTip(true);
        setShowHistory(false);
    };

    const handleLoadSession = async (sessionId: string) => {
        await loadSession(sessionId);
        setShowHistory(false);
        setShowTip(false);
    };

    const handleDeleteSession = async (event: React.MouseEvent, sessionId: string) => {
        event.stopPropagation();
        await deleteSession(sessionId);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return COPY.yesterday;
        if (diffDays < 7) return `${diffDays} ${COPY.daysAgo}`;
        return date.toLocaleDateString();
    };

    if (!isOpen) return null;

    const showHighlight = isDraggingNode || isDragOver;
    const panelBorder = showHighlight ? 'border-cyan-500 border-2' : isDark ? 'border-neutral-800' : 'border-neutral-200';
    const panelBg = isDark ? 'bg-[#1a1a1a]' : 'bg-white';
    const iconButton = isDark
        ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
        : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900';

    return (
        <div
            className={`fixed top-0 right-0 w-[400px] h-full border-l flex flex-col z-40 shadow-2xl transition-all duration-300 ${panelBorder} ${panelBg}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {showHighlight && (
                <div className="absolute inset-0 bg-cyan-500/10 pointer-events-none z-10 flex items-center justify-center">
                    <div className="bg-cyan-500/20 border-2 border-dashed border-cyan-400 rounded-2xl px-8 py-6 text-center">
                        <Sparkles className="w-10 h-10 mx-auto mb-2 text-cyan-400" />
                        <p className="text-cyan-300 font-medium">{COPY.dropReference}</p>
                    </div>
                </div>
            )}

            {showHistory && (
                <div className={`absolute inset-0 z-20 flex flex-col ${panelBg}`}>
                    <div className={`flex items-center gap-3 px-4 py-3 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        <button onClick={() => setShowHistory(false)} className={`p-1.5 rounded-lg transition-colors ${iconButton}`}>
                            <ChevronLeft size={18} />
                        </button>
                        <span className={`font-medium text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>{COPY.history}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                        {isLoadingSessions ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-8">
                                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-neutral-600" />
                                <p className="text-neutral-500 text-sm">{COPY.noHistory}</p>
                                <p className="text-neutral-600 text-xs mt-1">{COPY.historyHint}</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {sessions.map((session: ChatSession) => (
                                    <div
                                        key={session.id}
                                        onClick={() => handleLoadSession(session.id)}
                                        role="button"
                                        tabIndex={0}
                                        className={`w-full text-left p-3 rounded-xl transition-colors group cursor-pointer ${isDark ? 'bg-neutral-800/50 hover:bg-neutral-800' : 'bg-neutral-100 hover:bg-neutral-200'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-neutral-900'}`}>{session.topic}</p>
                                                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                                    {session.messageCount} {COPY.messages} · {formatDate(session.updatedAt || session.createdAt)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(event) => handleDeleteSession(event, session.id)}
                                                className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all text-neutral-500 hover:text-red-400"
                                                title={COPY.deleteChat}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className={`p-4 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                        <button
                            onClick={handleNewChat}
                            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 rounded-xl text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={16} />
                            {COPY.newChat}
                        </button>
                    </div>
                </div>
            )}

            <div className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <div className="flex items-center gap-3 min-w-0">
                    <span className={`font-medium text-sm truncate max-w-[170px] ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                        {topic || (hasMessages ? COPY.newChat : COPY.assistantTitle)}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full shrink-0 ${isDark ? 'bg-cyan-500/10 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}>
                        KIE GPT-5.5
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {hasMessages && (
                        <button onClick={handleNewChat} className={`p-1.5 rounded-lg transition-colors ${iconButton}`} title={COPY.newChat}>
                            <Plus size={18} />
                        </button>
                    )}
                    <button onClick={() => setShowHistory(true)} className={`p-1.5 rounded-lg transition-colors ${iconButton}`} title={COPY.history}>
                        <History size={18} />
                    </button>
                    <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${iconButton}`}>
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {!hasMessages ? (
                    <>
                        <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-neutral-900'}`}>Hi, {userName}</h1>
                        <p className="text-cyan-400 text-lg mb-6">{COPY.greeting}</p>

                        {showTip && (
                            <div className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-neutral-800/50' : 'bg-neutral-100'}`}>
                                <div className={`rounded-xl overflow-hidden mb-3 flex items-center justify-center ${isDark ? 'bg-neutral-700/50' : 'bg-neutral-200'}`}>
                                    <img src="/chat-preview.gif" alt="Drag and drop preview" className="w-full h-auto object-cover rounded-xl" />
                                </div>
                                <p className={`text-sm leading-relaxed mb-3 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>{COPY.contextTip}</p>
                                <div className="grid grid-cols-2 gap-2 mb-3">
                                    {SUGGESTIONS.map(suggestion => (
                                        <button
                                            key={suggestion}
                                            onClick={() => setMessage(suggestion)}
                                            className={`px-3 py-2 rounded-lg text-xs text-left transition-colors ${isDark ? 'bg-neutral-700 hover:bg-neutral-600 text-neutral-100' : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'}`}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowTip(false)}
                                        className={`px-4 py-1.5 rounded-lg text-sm transition-colors ${isDark ? 'bg-neutral-700 hover:bg-neutral-600 text-white' : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-900'}`}
                                    >
                                        {COPY.collapse}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="space-y-1">
                        {messages.map((msg: ChatMessageType) => (
                            <ChatMessage key={msg.id} role={msg.role} content={msg.content} media={msg.media} timestamp={msg.timestamp} />
                        ))}

                        {isLoading && (
                            <div className="flex justify-start mb-4">
                                <div className={`rounded-2xl rounded-bl-md px-4 py-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                                    <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="flex justify-center mb-4">
                                <div className="bg-red-500/20 border border-red-500/50 rounded-lg px-4 py-2 text-red-400 text-sm">{error}</div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            <div className={`p-4 border-t ${isDark ? 'border-neutral-800' : 'border-neutral-200'}`}>
                <div className={`rounded-2xl p-3 ${isDark ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
                    {attachedMedia.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {attachedMedia.map(media => (
                                <div key={media.nodeId} className="relative">
                                    {media.type === 'image' ? (
                                        <img src={media.url} alt="Attached" className="w-14 h-14 object-cover rounded-lg" />
                                    ) : (
                                        <video src={media.url} className="w-14 h-14 object-cover rounded-lg" />
                                    )}
                                    <button
                                        onClick={() => removeAttachment(media.nodeId)}
                                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-white"
                                        title={COPY.removeReference}
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder={COPY.placeholder}
                        className={`w-full bg-transparent text-sm outline-none mb-3 resize-none min-h-[24px] max-h-[120px] ${isDark ? 'text-white placeholder:text-neutral-500' : 'text-neutral-900 placeholder:text-neutral-400'}`}
                        rows={1}
                        style={{ scrollbarWidth: 'none' }}
                        disabled={isLoading}
                        onInput={(event) => {
                            const target = event.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            const newHeight = Math.min(target.scrollHeight, 120);
                            target.style.height = `${newHeight}px`;
                            target.style.overflowY = target.scrollHeight > 120 ? 'auto' : 'hidden';
                        }}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <div className="flex items-center justify-between">
                        <div className={`text-[11px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            {selectedNodeIds.length > 0
                                ? `${COPY.selectedAwarePrefix} ${selectedNodeIds.length} ${COPY.selectedAwareSuffix}`
                                : COPY.canvasAware}
                        </div>
                        <button
                            onClick={handleSend}
                            disabled={isLoading || (!message.trim() && attachedMedia.length === 0)}
                            className={`p-2 rounded-full transition-colors text-white ${isLoading || (!message.trim() && attachedMedia.length === 0)
                                ? 'bg-neutral-600 cursor-not-allowed'
                                : 'bg-cyan-500 hover:bg-cyan-400'
                                }`}
                        >
                            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ChatBubble: React.FC<ChatBubbleProps> = ({ onClick, isOpen }) => {
    if (isOpen) return null;

    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 h-12 px-4 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-full flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 z-[80] animate-breathing"
            style={{ animation: 'breathing 3s ease-in-out infinite' }}
        >
            <Sparkles size={22} className="text-white" />
            <span className="text-sm font-medium text-white whitespace-nowrap">{COPY.assistantTitle}</span>
            <style>{`
                @keyframes breathing {
                    0%, 100% {
                        transform: scale(1);
                        box-shadow: 0 10px 15px -3px rgba(6, 182, 212, 0.3), 0 4px 6px -4px rgba(6, 182, 212, 0.3);
                    }
                    50% {
                        transform: scale(1.08);
                        box-shadow: 0 20px 25px -5px rgba(6, 182, 212, 0.5), 0 8px 10px -6px rgba(6, 182, 212, 0.5);
                    }
                }
            `}</style>
        </button>
    );
};
