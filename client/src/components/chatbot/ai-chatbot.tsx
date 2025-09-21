import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, X, Send, Bot, User, Mic, MicOff, Volume2 } from "lucide-react";
import type { Chat } from "@shared/schema";
import robotImage from "@assets/generated_images/Agricultural_robot_mascot_1b6cf3a1.png";

interface ChatMessage {
  id: string;
  question: string;
  answer: string;
  language: string;
  timestamp: string;
  isUser: boolean;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();

  // Voice recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Error",
          description: "Could not recognize speech. Please try again.",
          variant: "destructive",
        });
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  // Fetch chat history
  const { data: chatHistory = [] } = useQuery<Chat[]>({
    queryKey: ["/api/chats"],
    enabled: isAuthenticated && isOpen,
  });

  // Send message mutation
  const sendMessageMutation = useMutation<Chat, Error, string>({
    mutationFn: async (message: string): Promise<Chat> => {
      const response = await apiRequest("POST", "/api/chat", {
        question: message,
        language: selectedLanguage,
      });
      return response as unknown as Chat;
    },
    onSuccess: (response: Chat) => {
      const newMessage: ChatMessage = {
        id: response.id,
        question: response.question,
        answer: response.answer,
        language: response.language,
        timestamp: response.timestamp ? new Date(response.timestamp).toISOString() : new Date().toISOString(),
        isUser: false,
      };
      
      setMessages(prev => [...prev, newMessage]);
      setInputMessage("");
      
      // Auto-play response if supported
      if ('speechSynthesis' in window) {
        speakText(response.answer, selectedLanguage);
      }
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  // Initialize chat with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: "welcome",
        question: "",
        answer: t('chatbot_welcome'),
        language: selectedLanguage,
        timestamp: new Date().toISOString(),
        isUser: false,
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, selectedLanguage, t]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Sync language with app language
  useEffect(() => {
    setSelectedLanguage(i18n.language);
  }, [i18n.language]);

  // Voice input functions
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.lang = selectedLanguage === 'te' ? 'te-IN' : 
                                       selectedLanguage === 'hi' ? 'hi-IN' :
                                       selectedLanguage === 'od' ? 'or-IN' : 'en-US';
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast({
          title: "Voice Error",
          description: "Speech recognition is not supported in your browser.",
          variant: "destructive",
        });
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Text-to-speech function
  const speakText = (text: string, language: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'te' ? 'te-IN' :
                      language === 'hi' ? 'hi-IN' :
                      language === 'od' ? 'or-IN' : 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isAuthenticated) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      question: inputMessage,
      answer: "",
      language: selectedLanguage,
      timestamp: new Date().toISOString(),
      isUser: true,
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(inputMessage);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Chat Bubble */}
      <Button
        onClick={toggleChat}
        className={`p-4 rounded-full shadow-lg transition-transform hover:scale-110 ${
          isOpen ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90"
        }`}
        data-testid="button-toggle-chat"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-96 shadow-2xl" data-testid="card-chat-window">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold">{t('agribot_assistant')}</h4>
                  <p className="text-xs text-primary-foreground/80">{t('online_now')}</p>
                </div>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            {/* Messages */}
            <ScrollArea className="h-80 p-4" data-testid="chat-messages">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isUser ? "justify-end" : "items-start space-x-3"}`}
                    data-testid={`message-${message.id}`}
                  >
                    {!message.isUser && (
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                        <img 
                          src={robotImage} 
                          alt="AgriBot" 
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-xs p-3 rounded-lg ${
                        message.isUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border"
                      }`}
                    >
                      <p className="text-sm">
                        {message.isUser ? message.question : message.answer}
                      </p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.isUser && (
                      <div className="w-8 h-8 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-secondary" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center space-x-2 mb-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={t('ask_about_farming')}
                  className="flex-1"
                  disabled={sendMessageMutation.isPending || isListening}
                  data-testid="input-chat-message"
                />
                
                {/* Voice Input Button */}
                <Button
                  onClick={isListening ? stopListening : startListening}
                  disabled={sendMessageMutation.isPending}
                  size="sm"
                  variant={isListening ? "destructive" : "outline"}
                  data-testid="button-voice-input"
                  title={isListening ? t('listening') : t('voice_input')}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </Button>
                
                {/* Text-to-Speech Button */}
                <Button
                  onClick={isPlaying ? stopSpeaking : () => speakText(messages[messages.length - 1]?.answer || '', selectedLanguage)}
                  disabled={sendMessageMutation.isPending || !messages.length || !messages[messages.length - 1]?.answer}
                  size="sm"
                  variant="outline"
                  data-testid="button-speak"
                  title="Play last response"
                >
                  {isPlaying ? (
                    <Volume2 className="w-4 h-4 animate-pulse" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </Button>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sendMessageMutation.isPending || isListening}
                  size="sm"
                  data-testid="button-send-message"
                >
                  {sendMessageMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="w-20 h-7 text-xs" data-testid="select-chat-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">EN</SelectItem>
                    <SelectItem value="hi">हि</SelectItem>
                    <SelectItem value="od">ଓଡ଼</SelectItem>
                    <SelectItem value="te">తె</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center space-x-2">
                  {isListening && (
                    <p className="text-xs text-accent animate-pulse">{t('listening')}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{t('powered_by_ai')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
