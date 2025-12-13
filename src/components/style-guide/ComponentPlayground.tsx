import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle, Info, Copy, Check, Sparkles, Terminal } from 'lucide-react';
import { toast } from 'sonner';

// Button Playground
const ButtonPlayground = () => {
  const [variant, setVariant] = useState<string>('default');
  const [size, setSize] = useState<string>('default');
  const [disabled, setDisabled] = useState(false);
  const [text, setText] = useState('Button Text');
  const [copied, setCopied] = useState(false);

  const variants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link', 'hero', 'success', 'warning', 'info'];
  const sizes = ['default', 'sm', 'lg', 'icon'];

  const generateCode = () => {
    const props: string[] = [];
    if (variant !== 'default') props.push(`variant="${variant}"`);
    if (size !== 'default') props.push(`size="${size}"`);
    if (disabled) props.push('disabled');
    
    return `<Button${props.length > 0 ? ' ' + props.join(' ') : ''}>${text}</Button>`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    toast.success('Code kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select value={variant} onValueChange={setVariant}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variants.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Size</Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Text</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={disabled} onCheckedChange={setDisabled} id="btn-disabled" />
          <Label htmlFor="btn-disabled">Disabled</Label>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col items-center gap-4 p-8 bg-muted/30 rounded-md border border-dashed">
        <span className="text-xs text-muted-foreground mb-2">Live-Vorschau</span>
        <Button 
          variant={variant as any} 
          size={size as any} 
          disabled={disabled}
        >
          {size === 'icon' ? <Sparkles className="h-4 w-4" /> : text}
        </Button>
      </div>

      <div className="relative">
        <pre className="bg-muted/50 border rounded-md p-4 pr-12 overflow-x-auto text-sm font-mono">
          {generateCode()}
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={copyCode}
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

// Badge Playground
const BadgePlayground = () => {
  const [variant, setVariant] = useState<string>('default');
  const [text, setText] = useState('Badge');
  const [copied, setCopied] = useState(false);

  const variants = ['default', 'secondary', 'destructive', 'warning', 'success', 'info', 'outline'];

  const generateCode = () => {
    const props: string[] = [];
    if (variant !== 'default') props.push(`variant="${variant}"`);
    return `<Badge${props.length > 0 ? ' ' + props.join(' ') : ''}>${text}</Badge>`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    toast.success('Code kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select value={variant} onValueChange={setVariant}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variants.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Text</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      </div>

      <Separator />

      <div className="flex flex-col items-center gap-4 p-8 bg-muted/30 rounded-md border border-dashed">
        <span className="text-xs text-muted-foreground mb-2">Live-Vorschau</span>
        <Badge variant={variant as any}>{text}</Badge>
      </div>

      <div className="relative">
        <pre className="bg-muted/50 border rounded-md p-4 pr-12 overflow-x-auto text-sm font-mono">
          {generateCode()}
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={copyCode}
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

// Card Playground
const CardPlayground = () => {
  const [title, setTitle] = useState('Card Title');
  const [description, setDescription] = useState('Card description text');
  const [showFooter, setShowFooter] = useState(true);
  const [copied, setCopied] = useState(false);

  const generateCode = () => {
    return `<Card>
  <CardHeader>
    <CardTitle>${title}</CardTitle>
    <CardDescription>${description}</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here...</p>
  </CardContent>${showFooter ? `
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>` : ''}
</Card>`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    toast.success('Code kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={showFooter} onCheckedChange={setShowFooter} id="card-footer" />
          <Label htmlFor="card-footer">Show Footer</Label>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col items-center gap-4 p-8 bg-muted/30 rounded-md border border-dashed">
        <span className="text-xs text-muted-foreground mb-2">Live-Vorschau</span>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Card content goes here...</p>
          </CardContent>
          {showFooter && (
            <div className="flex items-center p-6 pt-0">
              <Button size="sm">Action</Button>
            </div>
          )}
        </Card>
      </div>

      <div className="relative">
        <pre className="bg-muted/50 border rounded-md p-4 pr-12 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
          {generateCode()}
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={copyCode}
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

// Alert Playground
const AlertPlayground = () => {
  const [variant, setVariant] = useState<string>('default');
  const [title, setTitle] = useState('Alert Title');
  const [description, setDescription] = useState('This is an alert message.');
  const [copied, setCopied] = useState(false);

  const variants = [
    { value: 'default', icon: 'Terminal' },
    { value: 'destructive', icon: 'AlertCircle' },
  ];

  const generateCode = () => {
    const icon = variant === 'destructive' ? 'AlertCircle' : 'Terminal';
    const props = variant !== 'default' ? ` variant="${variant}"` : '';
    return `<Alert${props}>
  <${icon} className="h-4 w-4" />
  <AlertTitle>${title}</AlertTitle>
  <AlertDescription>${description}</AlertDescription>
</Alert>`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    toast.success('Code kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select value={variant} onValueChange={setVariant}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variants.map((v) => (
                <SelectItem key={v.value} value={v.value}>{v.value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>

      <Separator />

      <div className="flex flex-col items-center gap-4 p-8 bg-muted/30 rounded-md border border-dashed">
        <span className="text-xs text-muted-foreground mb-2">Live-Vorschau</span>
        <Alert variant={variant as any} className="max-w-md">
          {variant === 'destructive' ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Terminal className="h-4 w-4" />
          )}
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </Alert>
      </div>

      <div className="relative">
        <pre className="bg-muted/50 border rounded-md p-4 pr-12 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
          {generateCode()}
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={copyCode}
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

// Input Playground
const InputPlayground = () => {
  const [type, setType] = useState('text');
  const [placeholder, setPlaceholder] = useState('Enter text...');
  const [disabled, setDisabled] = useState(false);
  const [value, setValue] = useState('');
  const [copied, setCopied] = useState(false);

  const types = ['text', 'email', 'password', 'number', 'search', 'tel', 'url'];

  const generateCode = () => {
    const props: string[] = [];
    if (type !== 'text') props.push(`type="${type}"`);
    props.push(`placeholder="${placeholder}"`);
    if (disabled) props.push('disabled');
    
    return `<Input ${props.join(' ')} />`;
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generateCode());
    setCopied(true);
    toast.success('Code kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Preview Value</Label>
          <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Type to test..." />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={disabled} onCheckedChange={setDisabled} id="input-disabled" />
          <Label htmlFor="input-disabled">Disabled</Label>
        </div>
      </div>

      <Separator />

      <div className="flex flex-col items-center gap-4 p-8 bg-muted/30 rounded-md border border-dashed">
        <span className="text-xs text-muted-foreground mb-2">Live-Vorschau</span>
        <Input 
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="relative">
        <pre className="bg-muted/50 border rounded-md p-4 pr-12 overflow-x-auto text-sm font-mono">
          {generateCode()}
        </pre>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={copyCode}
        >
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

// Main Component Playground
export const ComponentPlayground = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Komponenten-Playground
        </CardTitle>
        <CardDescription>
          Interaktive Komponenten-Tests mit Live-Vorschau und Code-Generierung
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="button" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="button">Button</TabsTrigger>
            <TabsTrigger value="badge">Badge</TabsTrigger>
            <TabsTrigger value="card">Card</TabsTrigger>
            <TabsTrigger value="alert">Alert</TabsTrigger>
            <TabsTrigger value="input">Input</TabsTrigger>
          </TabsList>
          <TabsContent value="button" className="mt-6">
            <ButtonPlayground />
          </TabsContent>
          <TabsContent value="badge" className="mt-6">
            <BadgePlayground />
          </TabsContent>
          <TabsContent value="card" className="mt-6">
            <CardPlayground />
          </TabsContent>
          <TabsContent value="alert" className="mt-6">
            <AlertPlayground />
          </TabsContent>
          <TabsContent value="input" className="mt-6">
            <InputPlayground />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
