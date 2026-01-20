import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, CheckCircle, Info, Copy, Check, Sparkles, Terminal, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, ChevronDown, User, Calendar, Settings } from 'lucide-react';
import { toast } from 'sonner';

type ButtonVariant = NonNullable<ButtonProps['variant']>;
type ButtonSize = NonNullable<ButtonProps['size']>;
type BadgeVariant = NonNullable<BadgeProps['variant']>;
type SheetSide = 'left' | 'right' | 'top' | 'bottom';

// Helper for code copy
const useCopyCode = () => {
  const [copied, setCopied] = useState(false);
  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };
  return { copied, copy };
};

// Code Preview Component
const CodePreview = ({ code, onCopy, copied }: { code: string; onCopy: () => void; copied: boolean }) => (
  <div className="relative">
    <pre className="bg-muted/50 border rounded-md p-4 pr-12 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
      {code}
    </pre>
    <Button variant="ghost" size="icon" className="absolute top-2 right-2" onClick={onCopy}>
      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
    </Button>
  </div>
);

// Live Preview Container
const LivePreview = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-4 p-8 bg-muted/30 rounded-md border border-dashed">
    <span className="text-xs text-muted-foreground mb-2">Live-Vorschau</span>
    {children}
  </div>
);

// ========== BASICS ==========

const ButtonPlayground = () => {
  const [variant, setVariant] = useState('default');
  const [size, setSize] = useState('default');
  const [disabled, setDisabled] = useState(false);
  const [text, setText] = useState('Button Text');
  const { copied, copy } = useCopyCode();

  const variants = ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link', 'hero', 'success', 'warning', 'info'];
  const sizes = ['default', 'sm', 'lg', 'icon'];

  const generateCode = () => {
    const props: string[] = [];
    if (variant !== 'default') props.push(`variant="${variant}"`);
    if (size !== 'default') props.push(`size="${size}"`);
    if (disabled) props.push('disabled');
    return `<Button${props.length > 0 ? ' ' + props.join(' ') : ''}>${text}</Button>`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select value={variant} onValueChange={setVariant}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {variants.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Size</Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {sizes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
      <LivePreview>
        <Button variant={variant as ButtonVariant} size={size as ButtonSize} disabled={disabled}>
          {size === 'icon' ? <Sparkles className="h-4 w-4" /> : text}
        </Button>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const BadgePlayground = () => {
  const [variant, setVariant] = useState('default');
  const [text, setText] = useState('Badge');
  const { copied, copy } = useCopyCode();
  const variants = ['default', 'secondary', 'destructive', 'warning', 'success', 'info', 'outline'];

  const generateCode = () => {
    const props = variant !== 'default' ? ` variant="${variant}"` : '';
    return `<Badge${props}>${text}</Badge>`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select value={variant} onValueChange={setVariant}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {variants.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Text</Label>
          <Input value={text} onChange={(e) => setText(e.target.value)} />
        </div>
      </div>
      <Separator />
      <LivePreview>
        <Badge variant={variant as BadgeVariant}>{text}</Badge>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const InputPlayground = () => {
  const [type, setType] = useState('text');
  const [placeholder, setPlaceholder] = useState('Enter text...');
  const [disabled, setDisabled] = useState(false);
  const [value, setValue] = useState('');
  const { copied, copy } = useCopyCode();
  const types = ['text', 'email', 'password', 'number', 'search', 'tel', 'url'];

  const generateCode = () => {
    const props: string[] = [];
    if (type !== 'text') props.push(`type="${type}"`);
    props.push(`placeholder="${placeholder}"`);
    if (disabled) props.push('disabled');
    return `<Input ${props.join(' ')} />`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
      <LivePreview>
        <Input type={type} placeholder={placeholder} disabled={disabled} value={value} onChange={(e) => setValue(e.target.value)} className="max-w-sm" />
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const TextareaPlayground = () => {
  const [placeholder, setPlaceholder] = useState('Enter text...');
  const [rows, setRows] = useState(4);
  const [disabled, setDisabled] = useState(false);
  const { copied, copy } = useCopyCode();

  const generateCode = () => {
    const props: string[] = [`placeholder="${placeholder}"`];
    if (rows !== 4) props.push(`rows={${rows}}`);
    if (disabled) props.push('disabled');
    return `<Textarea ${props.join(' ')} />`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Rows: {rows}</Label>
          <Slider value={[rows]} onValueChange={(v) => setRows(v[0])} min={2} max={10} step={1} />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={disabled} onCheckedChange={setDisabled} id="textarea-disabled" />
          <Label htmlFor="textarea-disabled">Disabled</Label>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <Textarea placeholder={placeholder} rows={rows} disabled={disabled} className="max-w-md" />
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

// ========== OVERLAYS ==========

const DialogPlayground = () => {
  const [title, setTitle] = useState('Dialog Title');
  const [description, setDescription] = useState('Dialog description here.');
  const [showFooter, setShowFooter] = useState(true);
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>${title}</DialogTitle>
      <DialogDescription>${description}</DialogDescription>
    </DialogHeader>
    <div>Dialog content here...</div>${showFooter ? `
    <DialogFooter>
      <Button>Save</Button>
    </DialogFooter>` : ''}
  </DialogContent>
</Dialog>`;

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
          <Switch checked={showFooter} onCheckedChange={setShowFooter} id="dialog-footer" />
          <Label htmlFor="dialog-footer">Show Footer</Label>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>
            <div className="py-4 text-sm text-muted-foreground">Dialog content here...</div>
            {showFooter && (
              <DialogFooter>
                <Button>Save</Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const SheetPlayground = () => {
  const [side, setSide] = useState<'left' | 'right' | 'top' | 'bottom'>('right');
  const [title, setTitle] = useState('Sheet Title');
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Sheet>
  <SheetTrigger asChild>
    <Button>Open Sheet</Button>
  </SheetTrigger>
  <SheetContent side="${side}">
    <SheetHeader>
      <SheetTitle>${title}</SheetTitle>
      <SheetDescription>Sheet content here</SheetDescription>
    </SheetHeader>
  </SheetContent>
</Sheet>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Side</Label>
          <Select value={side} onValueChange={(v) => setSide(v as SheetSide)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['left', 'right', 'top', 'bottom'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
      </div>
      <Separator />
      <LivePreview>
        <Sheet>
          <SheetTrigger asChild>
            <Button>Open Sheet ({side})</Button>
          </SheetTrigger>
          <SheetContent side={side}>
            <SheetHeader>
              <SheetTitle>{title}</SheetTitle>
              <SheetDescription>Sheet content goes here...</SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const AlertDialogPlayground = () => {
  const [title, setTitle] = useState('Are you sure?');
  const [description, setDescription] = useState('This action cannot be undone.');
  const [confirmText, setConfirmText] = useState('Continue');
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>${title}</AlertDialogTitle>
      <AlertDialogDescription>${description}</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>${confirmText}</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`;

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
        <div className="space-y-2">
          <Label>Confirm Text</Label>
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} />
        </div>
      </div>
      <Separator />
      <LivePreview>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>{confirmText}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const PopoverPlayground = () => {
  const [triggerText, setTriggerText] = useState('Open Popover');
  const [content, setContent] = useState('Popover content here');
  const [side, setSide] = useState<'top' | 'right' | 'bottom' | 'left'>('bottom');
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline">${triggerText}</Button>
  </PopoverTrigger>
  <PopoverContent side="${side}">
    ${content}
  </PopoverContent>
</Popover>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Trigger Text</Label>
          <Input value={triggerText} onChange={(e) => setTriggerText(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Content</Label>
          <Input value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Side</Label>
          <Select value={side} onValueChange={(v) => setSide(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['top', 'right', 'bottom', 'left'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">{triggerText}</Button>
          </PopoverTrigger>
          <PopoverContent side={side} className="w-64">
            <p className="text-sm">{content}</p>
          </PopoverContent>
        </Popover>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const TooltipPlayground = () => {
  const [content, setContent] = useState('Tooltip text');
  const [side, setSide] = useState<'top' | 'right' | 'bottom' | 'left'>('top');
  const [delayDuration, setDelayDuration] = useState(200);
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<TooltipProvider>
  <Tooltip delayDuration={${delayDuration}}>
    <TooltipTrigger asChild>
      <Button variant="outline">Hover me</Button>
    </TooltipTrigger>
    <TooltipContent side="${side}">
      ${content}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Content</Label>
          <Input value={content} onChange={(e) => setContent(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Side</Label>
          <Select value={side} onValueChange={(v) => setSide(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {['top', 'right', 'bottom', 'left'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Delay: {delayDuration}ms</Label>
          <Slider value={[delayDuration]} onValueChange={(v) => setDelayDuration(v[0])} min={0} max={1000} step={50} />
        </div>
      </div>
      <Separator />
      <LivePreview>
        <TooltipProvider>
          <Tooltip delayDuration={delayDuration}>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent side={side}>
              {content}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const HoverCardPlayground = () => {
  const [triggerText, setTriggerText] = useState('@nextjs');
  const [openDelay, setOpenDelay] = useState(200);
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<HoverCard openDelay={${openDelay}}>
  <HoverCardTrigger asChild>
    <Button variant="link">${triggerText}</Button>
  </HoverCardTrigger>
  <HoverCardContent>
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Next.js</h4>
      <p className="text-sm">The React Framework</p>
    </div>
  </HoverCardContent>
</HoverCard>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Trigger Text</Label>
          <Input value={triggerText} onChange={(e) => setTriggerText(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Open Delay: {openDelay}ms</Label>
          <Slider value={[openDelay]} onValueChange={(v) => setOpenDelay(v[0])} min={0} max={1000} step={50} />
        </div>
      </div>
      <Separator />
      <LivePreview>
        <HoverCard openDelay={openDelay}>
          <HoverCardTrigger asChild>
            <Button variant="link">{triggerText}</Button>
          </HoverCardTrigger>
          <HoverCardContent className="w-64">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Next.js</h4>
              <p className="text-sm text-muted-foreground">The React Framework for Production</p>
            </div>
          </HoverCardContent>
        </HoverCard>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

// ========== FORMS ==========

const CheckboxPlayground = () => {
  const [checked, setChecked] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [label, setLabel] = useState('Accept terms');
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<div className="flex items-center space-x-2">
  <Checkbox id="terms"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''} />
  <Label htmlFor="terms">${label}</Label>
</div>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Label Text</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={checked} onCheckedChange={setChecked} id="cb-checked" />
          <Label htmlFor="cb-checked">Checked</Label>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={disabled} onCheckedChange={setDisabled} id="cb-disabled" />
          <Label htmlFor="cb-disabled">Disabled</Label>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms-preview" checked={checked} onCheckedChange={(c) => setChecked(!!c)} disabled={disabled} />
          <Label htmlFor="terms-preview">{label}</Label>
        </div>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const SwitchPlayground = () => {
  const [checked, setChecked] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [label, setLabel] = useState('Airplane Mode');
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<div className="flex items-center space-x-2">
  <Switch id="mode"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''} />
  <Label htmlFor="mode">${label}</Label>
</div>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Label Text</Label>
          <Input value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={checked} onCheckedChange={setChecked} id="sw-checked" />
          <Label htmlFor="sw-checked">Checked</Label>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={disabled} onCheckedChange={setDisabled} id="sw-disabled" />
          <Label htmlFor="sw-disabled">Disabled</Label>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <div className="flex items-center space-x-2">
          <Switch id="mode-preview" checked={checked} onCheckedChange={setChecked} disabled={disabled} />
          <Label htmlFor="mode-preview">{label}</Label>
        </div>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const RadioGroupPlayground = () => {
  const [value, setValue] = useState('option-1');
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('vertical');
  const [disabled, setDisabled] = useState(false);
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<RadioGroup defaultValue="option-1"${orientation === 'horizontal' ? ' className="flex gap-4"' : ''}${disabled ? ' disabled' : ''}>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-1" id="r1" />
    <Label htmlFor="r1">Option 1</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-2" id="r2" />
    <Label htmlFor="r2">Option 2</Label>
  </div>
  <div className="flex items-center space-x-2">
    <RadioGroupItem value="option-3" id="r3" />
    <Label htmlFor="r3">Option 3</Label>
  </div>
</RadioGroup>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Orientation</Label>
          <Select value={orientation} onValueChange={(v) => setOrientation(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vertical">Vertical</SelectItem>
              <SelectItem value="horizontal">Horizontal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={disabled} onCheckedChange={setDisabled} id="radio-disabled" />
          <Label htmlFor="radio-disabled">Disabled</Label>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <RadioGroup value={value} onValueChange={setValue} className={orientation === 'horizontal' ? 'flex gap-4' : ''} disabled={disabled}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-1" id="r1-preview" />
            <Label htmlFor="r1-preview">Option 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-2" id="r2-preview" />
            <Label htmlFor="r2-preview">Option 2</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option-3" id="r3-preview" />
            <Label htmlFor="r3-preview">Option 3</Label>
          </div>
        </RadioGroup>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const SelectPlayground = () => {
  const [placeholder, setPlaceholder] = useState('Select option');
  const [disabled, setDisabled] = useState(false);
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Select${disabled ? ' disabled' : ''}>
  <SelectTrigger>
    <SelectValue placeholder="${placeholder}" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option-1">Option 1</SelectItem>
    <SelectItem value="option-2">Option 2</SelectItem>
    <SelectItem value="option-3">Option 3</SelectItem>
  </SelectContent>
</Select>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={disabled} onCheckedChange={setDisabled} id="select-disabled" />
          <Label htmlFor="select-disabled">Disabled</Label>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <Select disabled={disabled}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option-1">Option 1</SelectItem>
            <SelectItem value="option-2">Option 2</SelectItem>
            <SelectItem value="option-3">Option 3</SelectItem>
          </SelectContent>
        </Select>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const SliderPlayground = () => {
  const [value, setValue] = useState([50]);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);
  const [step, setStep] = useState(1);
  const [disabled, setDisabled] = useState(false);
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Slider 
  defaultValue={[${value[0]}]} 
  min={${min}} 
  max={${max}} 
  step={${step}}${disabled ? ' disabled' : ''} 
/>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2">
          <Label>Value: {value[0]}</Label>
          <Slider value={value} onValueChange={setValue} min={min} max={max} step={step} disabled={disabled} />
        </div>
        <div className="space-y-2">
          <Label>Min</Label>
          <Input type="number" value={min} onChange={(e) => setMin(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Max</Label>
          <Input type="number" value={max} onChange={(e) => setMax(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Step</Label>
          <Input type="number" value={step} onChange={(e) => setStep(Number(e.target.value))} />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={disabled} onCheckedChange={setDisabled} id="slider-disabled" />
          <Label htmlFor="slider-disabled">Disabled</Label>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <div className="w-64">
          <Slider value={value} onValueChange={setValue} min={min} max={max} step={step} disabled={disabled} />
          <p className="text-center text-sm text-muted-foreground mt-2">Value: {value[0]}</p>
        </div>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

// ========== LAYOUT ==========

const TabsPlayground = () => {
  const [defaultValue, setDefaultValue] = useState('tab1');
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Tabs defaultValue="${defaultValue}">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
    <TabsTrigger value="tab3">Tab 3</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
  <TabsContent value="tab3">Content 3</TabsContent>
</Tabs>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Default Tab</Label>
          <Select value={defaultValue} onValueChange={setDefaultValue}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="tab1">Tab 1</SelectItem>
              <SelectItem value="tab2">Tab 2</SelectItem>
              <SelectItem value="tab3">Tab 3</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <Tabs defaultValue={defaultValue} className="w-full max-w-md">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tab1">Tab 1</TabsTrigger>
            <TabsTrigger value="tab2">Tab 2</TabsTrigger>
            <TabsTrigger value="tab3">Tab 3</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="p-4">Content for Tab 1</TabsContent>
          <TabsContent value="tab2" className="p-4">Content for Tab 2</TabsContent>
          <TabsContent value="tab3" className="p-4">Content for Tab 3</TabsContent>
        </Tabs>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const AccordionPlayground = () => {
  const [type, setType] = useState<'single' | 'multiple'>('single');
  const [collapsible, setCollapsible] = useState(true);
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Accordion type="${type}"${type === 'single' && collapsible ? ' collapsible' : ''}>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section 1</AccordionTrigger>
    <AccordionContent>Content 1</AccordionContent>
  </AccordionItem>
  <AccordionItem value="item-2">
    <AccordionTrigger>Section 2</AccordionTrigger>
    <AccordionContent>Content 2</AccordionContent>
  </AccordionItem>
</Accordion>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="multiple">Multiple</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {type === 'single' && (
          <div className="flex items-center space-x-2 pt-6">
            <Switch checked={collapsible} onCheckedChange={setCollapsible} id="acc-collapsible" />
            <Label htmlFor="acc-collapsible">Collapsible</Label>
          </div>
        )}
      </div>
      <Separator />
      <LivePreview>
        <div className="w-full max-w-md">
          {type === 'single' ? (
            <Accordion type="single" collapsible={collapsible}>
              <AccordionItem value="item-1">
                <AccordionTrigger>Section 1</AccordionTrigger>
                <AccordionContent>Content for section 1</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Section 2</AccordionTrigger>
                <AccordionContent>Content for section 2</AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <Accordion type="multiple">
              <AccordionItem value="item-1">
                <AccordionTrigger>Section 1</AccordionTrigger>
                <AccordionContent>Content for section 1</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Section 2</AccordionTrigger>
                <AccordionContent>Content for section 2</AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </div>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const CollapsiblePlayground = () => {
  const [open, setOpen] = useState(false);
  const [triggerText, setTriggerText] = useState('Toggle Content');
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Collapsible${open ? ' open' : ''}>
  <CollapsibleTrigger asChild>
    <Button variant="ghost">
      ${triggerText}
      <ChevronDown className="h-4 w-4 ml-2" />
    </Button>
  </CollapsibleTrigger>
  <CollapsibleContent>
    <div className="p-4">Collapsible content here...</div>
  </CollapsibleContent>
</Collapsible>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Trigger Text</Label>
          <Input value={triggerText} onChange={(e) => setTriggerText(e.target.value)} />
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={open} onCheckedChange={setOpen} id="coll-open" />
          <Label htmlFor="coll-open">Open</Label>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost">
              {triggerText}
              <ChevronDown className={`h-4 w-4 ml-2 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="p-4 border rounded-md mt-2">
            Collapsible content here...
          </CollapsibleContent>
        </Collapsible>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const SeparatorPlayground = () => {
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Separator orientation="${orientation}" />`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Orientation</Label>
          <Select value={orientation} onValueChange={(v) => setOrientation(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="horizontal">Horizontal</SelectItem>
              <SelectItem value="vertical">Vertical</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <div className={orientation === 'vertical' ? 'flex h-20 items-center gap-4' : 'space-y-4 w-64'}>
          <span>Before</span>
          <Separator orientation={orientation} className={orientation === 'vertical' ? 'h-full' : ''} />
          <span>After</span>
        </div>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

// ========== FEEDBACK ==========

const ProgressPlayground = () => {
  const [value, setValue] = useState(60);
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Progress value={${value}} />`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Value: {value}%</Label>
          <Slider value={[value]} onValueChange={(v) => setValue(v[0])} min={0} max={100} step={1} />
        </div>
      </div>
      <Separator />
      <LivePreview>
        <div className="w-64">
          <Progress value={value} />
          <p className="text-center text-sm text-muted-foreground mt-2">{value}%</p>
        </div>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const SkeletonPlayground = () => {
  const [variant, setVariant] = useState('text');
  const { copied, copy } = useCopyCode();

  const generateCode = () => {
    if (variant === 'card') {
      return `<div className="space-y-3">
  <Skeleton className="h-32 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>`;
    }
    if (variant === 'avatar') {
      return `<div className="flex items-center gap-4">
  <Skeleton className="h-12 w-12 rounded-full" />
  <div className="space-y-2">
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-3 w-24" />
  </div>
</div>`;
    }
    return `<div className="space-y-2">
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
</div>`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select value={variant} onValueChange={setVariant}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Lines</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="avatar">Avatar + Text</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <div className="w-64">
          {variant === 'card' && (
            <div className="space-y-3">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
          {variant === 'avatar' && (
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          )}
          {variant === 'text' && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
        </div>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const AvatarPlayground = () => {
  const [fallback, setFallback] = useState('JD');
  const [showImage, setShowImage] = useState(true);
  const [size, setSize] = useState('default');
  const { copied, copy } = useCopyCode();

  const sizeClasses: Record<string, string> = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-14 w-14',
    xl: 'h-20 w-20',
  };

  const generateCode = () => `<Avatar${size !== 'default' ? ` className="${sizeClasses[size]}"` : ''}>
  ${showImage ? '<AvatarImage src="https://github.com/shadcn.png" />' : ''}
  <AvatarFallback>${fallback}</AvatarFallback>
</Avatar>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Fallback Text</Label>
          <Input value={fallback} onChange={(e) => setFallback(e.target.value)} maxLength={2} />
        </div>
        <div className="space-y-2">
          <Label>Size</Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
              <SelectItem value="xl">Extra Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={showImage} onCheckedChange={setShowImage} id="avatar-image" />
          <Label htmlFor="avatar-image">Show Image</Label>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <Avatar className={sizeClasses[size]}>
          {showImage && <AvatarImage src="https://github.com/shadcn.png" />}
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const AlertPlayground = () => {
  const [variant, setVariant] = useState('default');
  const [title, setTitle] = useState('Alert Title');
  const [description, setDescription] = useState('This is an alert message.');
  const { copied, copy } = useCopyCode();

  const generateCode = () => {
    const icon = variant === 'destructive' ? 'AlertCircle' : 'Terminal';
    const props = variant !== 'default' ? ` variant="${variant}"` : '';
    return `<Alert${props}>
  <${icon} className="h-4 w-4" />
  <AlertTitle>${title}</AlertTitle>
  <AlertDescription>${description}</AlertDescription>
</Alert>`;
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select value={variant} onValueChange={setVariant}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="destructive">Destructive</SelectItem>
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
      <LivePreview>
        <Alert variant={variant as any} className="max-w-md">
          {variant === 'destructive' ? <AlertCircle className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{description}</AlertDescription>
        </Alert>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

// ========== DATA ==========

const CardPlayground = () => {
  const [title, setTitle] = useState('Card Title');
  const [description, setDescription] = useState('Card description text');
  const [showFooter, setShowFooter] = useState(true);
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Card>
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
      <LivePreview>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Card content goes here...</p>
          </CardContent>
          {showFooter && (
            <CardFooter>
              <Button size="sm">Action</Button>
            </CardFooter>
          )}
        </Card>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const TablePlayground = () => {
  const [striped, setStriped] = useState(false);
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Role</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow${striped ? ' className="even:bg-muted/50"' : ''}>
      <TableCell>John Doe</TableCell>
      <TableCell>Active</TableCell>
      <TableCell>Admin</TableCell>
    </TableRow>
    <TableRow${striped ? ' className="even:bg-muted/50"' : ''}>
      <TableCell>Jane Smith</TableCell>
      <TableCell>Pending</TableCell>
      <TableCell>User</TableCell>
    </TableRow>
  </TableBody>
</Table>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center space-x-2">
          <Switch checked={striped} onCheckedChange={setStriped} id="table-striped" />
          <Label htmlFor="table-striped">Striped Rows</Label>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <div className="w-full max-w-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className={striped ? 'even:bg-muted/50' : ''}>
                <TableCell>John Doe</TableCell>
                <TableCell><Badge variant="success">Active</Badge></TableCell>
                <TableCell>Admin</TableCell>
              </TableRow>
              <TableRow className={striped ? 'even:bg-muted/50' : ''}>
                <TableCell>Jane Smith</TableCell>
                <TableCell><Badge variant="warning">Pending</Badge></TableCell>
                <TableCell>User</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const TogglePlayground = () => {
  const [pressed, setPressed] = useState(false);
  const [variant, setVariant] = useState<'default' | 'outline'>('default');
  const [size, setSize] = useState<'default' | 'sm' | 'lg'>('default');
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<Toggle 
  variant="${variant}" 
  size="${size}"${pressed ? ' pressed' : ''} 
  aria-label="Toggle bold"
>
  <Bold className="h-4 w-4" />
</Toggle>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select value={variant} onValueChange={(v) => setVariant(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Size</Label>
          <Select value={size} onValueChange={(v) => setSize(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2 pt-6">
          <Switch checked={pressed} onCheckedChange={setPressed} id="toggle-pressed" />
          <Label htmlFor="toggle-pressed">Pressed</Label>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <Toggle variant={variant} size={size} pressed={pressed} onPressedChange={setPressed} aria-label="Toggle bold">
          <Bold className="h-4 w-4" />
        </Toggle>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

const ToggleGroupPlayground = () => {
  const [type, setType] = useState<'single' | 'multiple'>('single');
  const [variant, setVariant] = useState<'default' | 'outline'>('default');
  const { copied, copy } = useCopyCode();

  const generateCode = () => `<ToggleGroup type="${type}" variant="${variant}">
  <ToggleGroupItem value="bold" aria-label="Toggle bold">
    <Bold className="h-4 w-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="italic" aria-label="Toggle italic">
    <Italic className="h-4 w-4" />
  </ToggleGroupItem>
  <ToggleGroupItem value="underline" aria-label="Toggle underline">
    <Underline className="h-4 w-4" />
  </ToggleGroupItem>
</ToggleGroup>`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="multiple">Multiple</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Variant</Label>
          <Select value={variant} onValueChange={(v) => setVariant(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Separator />
      <LivePreview>
        <ToggleGroup type={type} variant={variant}>
          <ToggleGroupItem value="bold" aria-label="Toggle bold">
            <Bold className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="italic" aria-label="Toggle italic">
            <Italic className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="underline" aria-label="Toggle underline">
            <Underline className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </LivePreview>
      <CodePreview code={generateCode()} onCopy={() => copy(generateCode())} copied={copied} />
    </div>
  );
};

// ========== MAIN COMPONENT ==========

export const ComponentPlayground = () => {
  const categories = [
    {
      id: 'basics',
      label: 'Basics',
      components: [
        { id: 'button', label: 'Button', component: ButtonPlayground },
        { id: 'badge', label: 'Badge', component: BadgePlayground },
        { id: 'input', label: 'Input', component: InputPlayground },
        { id: 'textarea', label: 'Textarea', component: TextareaPlayground },
      ],
    },
    {
      id: 'overlays',
      label: 'Overlays',
      components: [
        { id: 'dialog', label: 'Dialog', component: DialogPlayground },
        { id: 'sheet', label: 'Sheet', component: SheetPlayground },
        { id: 'alert-dialog', label: 'Alert Dialog', component: AlertDialogPlayground },
        { id: 'popover', label: 'Popover', component: PopoverPlayground },
        { id: 'tooltip', label: 'Tooltip', component: TooltipPlayground },
        { id: 'hover-card', label: 'Hover Card', component: HoverCardPlayground },
      ],
    },
    {
      id: 'forms',
      label: 'Forms',
      components: [
        { id: 'checkbox', label: 'Checkbox', component: CheckboxPlayground },
        { id: 'switch', label: 'Switch', component: SwitchPlayground },
        { id: 'radio', label: 'Radio Group', component: RadioGroupPlayground },
        { id: 'select', label: 'Select', component: SelectPlayground },
        { id: 'slider', label: 'Slider', component: SliderPlayground },
      ],
    },
    {
      id: 'layout',
      label: 'Layout',
      components: [
        { id: 'tabs', label: 'Tabs', component: TabsPlayground },
        { id: 'accordion', label: 'Accordion', component: AccordionPlayground },
        { id: 'collapsible', label: 'Collapsible', component: CollapsiblePlayground },
        { id: 'separator', label: 'Separator', component: SeparatorPlayground },
      ],
    },
    {
      id: 'feedback',
      label: 'Feedback',
      components: [
        { id: 'progress', label: 'Progress', component: ProgressPlayground },
        { id: 'skeleton', label: 'Skeleton', component: SkeletonPlayground },
        { id: 'avatar', label: 'Avatar', component: AvatarPlayground },
        { id: 'alert', label: 'Alert', component: AlertPlayground },
      ],
    },
    {
      id: 'data',
      label: 'Data',
      components: [
        { id: 'card', label: 'Card', component: CardPlayground },
        { id: 'table', label: 'Table', component: TablePlayground },
        { id: 'toggle', label: 'Toggle', component: TogglePlayground },
        { id: 'toggle-group', label: 'Toggle Group', component: ToggleGroupPlayground },
      ],
    },
  ];

  const [activeCategory, setActiveCategory] = useState('basics');
  const [activeComponent, setActiveComponent] = useState('button');

  const currentCategory = categories.find((c) => c.id === activeCategory);
  const CurrentComponent = currentCategory?.components.find((c) => c.id === activeComponent)?.component;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Komponenten-Playground
        </CardTitle>
        <CardDescription>
          Interaktive Komponenten-Tests mit Live-Vorschau und Code-Generierung • {categories.reduce((acc, c) => acc + c.components.length, 0)} Komponenten
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={(v) => {
            setActiveCategory(v);
            const cat = categories.find((c) => c.id === v);
            if (cat) setActiveComponent(cat.components[0].id);
          }}>
            <ScrollArea className="w-full">
              <TabsList className="inline-flex w-full justify-start">
                {categories.map((cat) => (
                  <TabsTrigger key={cat.id} value={cat.id} className="min-w-fit">
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </ScrollArea>
          </Tabs>

          {/* Component Tabs within Category */}
          {currentCategory && (
            <Tabs value={activeComponent} onValueChange={setActiveComponent}>
              <ScrollArea className="w-full">
                <TabsList className="inline-flex w-full justify-start bg-muted/50">
                  {currentCategory.components.map((comp) => (
                    <TabsTrigger key={comp.id} value={comp.id} className="min-w-fit">
                      {comp.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
              
              {currentCategory.components.map((comp) => (
                <TabsContent key={comp.id} value={comp.id} className="mt-6">
                  <comp.component />
                </TabsContent>
              ))}
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
