import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  language?: string;
  timestamp: Date;
}

interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript', icon: '🟨' },
  { value: 'python', label: 'Python', icon: '🐍' },
  { value: 'java', label: 'Java', icon: '☕' },
  { value: 'cpp', label: 'C++', icon: '⚡' },
  { value: 'go', label: 'Go', icon: '🔷' },
  { value: 'typescript', label: 'TypeScript', icon: '💙' },
  { value: 'rust', label: 'Rust', icon: '🦀' },
  { value: 'php', label: 'PHP', icon: '🐘' },
];

const API_URL = 'https://functions.poehali.dev/d6b5174d-a9d6-4774-894c-162453dd2e30';

const Index = () => {
  const { toast } = useToast();
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentChat, setCurrentChat] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Привет! Я Gelaxyai - ваш помощник в создании скриптов. Выберите язык программирования и опишите, какой код вам нужен.',
      timestamp: new Date(),
    },
  ]);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    {
      id: '1',
      title: 'Новый чат',
      timestamp: new Date(),
      messages: [],
    },
  ]);
  const [activeChatId, setActiveChatId] = useState('1');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
    };

    setCurrentChat(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage.content,
          language: selectedLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при генерации кода');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Вот код на ${LANGUAGES.find(l => l.value === selectedLanguage)?.label}:\n\n${data.code}`,
        language: selectedLanguage,
        timestamp: new Date(),
      };

      setCurrentChat(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось сгенерировать код',
        variant: 'destructive',
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Извините, произошла ошибка при генерации кода. Попробуйте снова или проверьте настройки API.',
        timestamp: new Date(),
      };

      setCurrentChat(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = () => {
    const newChatId = Date.now().toString();
    const newChat: ChatHistory = {
      id: newChatId,
      title: 'Новый чат',
      timestamp: new Date(),
      messages: [],
    };
    setChatHistory([newChat, ...chatHistory]);
    setActiveChatId(newChatId);
    setCurrentChat([
      {
        id: '1',
        role: 'assistant',
        content: 'Привет! Я Gelaxyai - ваш помощник в создании скриптов. Выберите язык программирования и опишите, какой код вам нужен.',
        timestamp: new Date(),
      },
    ]);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  return (
    <div className="h-screen flex bg-background">
      <div
        className={`${
          sidebarOpen ? 'w-72' : 'w-0'
        } transition-all duration-300 overflow-hidden bg-card border-r border-border`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <Button
              onClick={createNewChat}
              className="w-full justify-start gap-2"
              variant="default"
            >
              <Icon name="Plus" size={18} />
              Новый чат
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {chatHistory.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setCurrentChat(chat.messages.length > 0 ? chat.messages : [
                      {
                        id: '1',
                        role: 'assistant',
                        content: 'Привет! Я Gelaxyai - ваш помощник в создании скриптов.',
                        timestamp: new Date(),
                      },
                    ]);
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    activeChatId === chat.id
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-accent/50 text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon name="MessageSquare" size={16} />
                    <span className="font-medium text-sm truncate">{chat.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {chat.timestamp.toLocaleDateString('ru')}
                  </span>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Icon name={sidebarOpen ? 'PanelLeftClose' : 'PanelLeftOpen'} size={20} />
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Icon name="Sparkles" size={22} className="text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Gelaxyai</h1>
                <p className="text-xs text-muted-foreground">Генерация кода с ИИ</p>
              </div>
            </div>
          </div>

          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  <span className="flex items-center gap-2">
                    <span>{lang.icon}</span>
                    <span>{lang.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>

        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {currentChat.map((message, index) => (
              <div
                key={message.id}
                className={`animate-fade-in ${
                  message.role === 'user' ? 'flex justify-end' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {message.role === 'user' ? (
                  <Card className="max-w-[80%] p-4 bg-primary text-primary-foreground">
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </Card>
                ) : (
                  <Card className="p-4 bg-card">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Icon name="Bot" size={18} className="text-primary-foreground" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="whitespace-pre-wrap text-sm">{message.content.split('\n\n')[0]}</p>
                        {message.content.includes('```') || message.content.split('\n').length > 2 ? (
                          <div className="relative">
                            <div className="absolute top-2 right-2 z-10">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => copyToClipboard(message.content.split('\n\n')[1] || message.content)}
                              >
                                <Icon name="Copy" size={14} className="mr-1" />
                                Копировать
                              </Button>
                            </div>
                            <pre className="bg-secondary text-secondary-foreground p-4 rounded-lg overflow-x-auto text-sm">
                              <code>{message.content.split('\n\n')[1] || message.content}</code>
                            </pre>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-border bg-card p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                placeholder="Опишите какой код вам нужен..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button onClick={handleSendMessage} size="icon" className="flex-shrink-0" disabled={isLoading}>
                {isLoading ? (
                  <Icon name="Loader2" size={18} className="animate-spin" />
                ) : (
                  <Icon name="Send" size={18} />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Gelaxyai может совершать ошибки. Проверяйте важную информацию.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;