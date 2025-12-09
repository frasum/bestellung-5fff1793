import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Camera, Upload, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useArticles } from '@/hooks/useArticles';
import { useMySubmissions, useCreateSubmission, useEmployeeSubmissions, EmployeeOrderSubmission } from '@/hooks/useEmployeeSubmissions';
import { useHasRole } from '@/hooks/useUserRole';
import StaffOrderPreview from '@/components/staff/StaffOrderPreview';
import StaffSubmissionHistory from '@/components/staff/StaffSubmissionHistory';
import EmployeeSubmissionReviewDialog from '@/components/staff/EmployeeSubmissionReviewDialog';

interface ParsedItem {
  article_id: string | null;
  article_name: string;
  quantity: number;
  recognized_text: string;
  confidence: number;
}

export default function StaffOrdersTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { data: articles = [] } = useArticles();
  const { data: mySubmissions = [] } = useMySubmissions();
  const { data: allSubmissions = [] } = useEmployeeSubmissions();
  const { hasRole: canSeeAllSubmissions } = useHasRole(['admin', 'manager']);
  const createSubmission = useCreateSubmission();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [transcription, setTranscription] = useState<string>('');
  const [submissionType, setSubmissionType] = useState<'photo' | 'voice' | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<EmployeeOrderSubmission | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setSubmissionType('voice');
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: t('common.error'),
        description: 'Mikrofon konnte nicht aktiviert werden',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
        'transcribe-voice-order',
        { body: { audio: base64 } }
      );

      if (transcribeError) throw transcribeError;
      
      const text = transcribeData.text;
      setTranscription(text);

      await parseOrderText(text);
    } catch (error) {
      console.error('Error processing audio:', error);
      toast({
        title: t('common.error'),
        description: 'Sprachaufnahme konnte nicht verarbeitet werden',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setSubmissionType('photo');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      const articlesForScan = articles.map(a => ({
        id: a.id,
        name: a.name,
        sku: a.sku,
        unit: a.unit,
      }));

      const { data, error } = await supabase.functions.invoke('scan-order-list', {
        body: { imageBase64: base64, articles: articlesForScan },
      });

      if (error) throw error;

      if (data.items && data.items.length > 0) {
        setParsedItems(data.items.map((item: any) => ({
          article_id: item.articleId,
          article_name: item.articleName,
          quantity: item.quantity,
          recognized_text: item.originalText || item.articleName,
          confidence: item.confidence || 0.9,
        })));
      } else {
        toast({
          title: 'Keine Artikel erkannt',
          description: 'Bitte versuche ein deutlicheres Foto',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error processing photo:', error);
      toast({
        title: t('common.error'),
        description: 'Foto konnte nicht verarbeitet werden',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const parseOrderText = async (text: string) => {
    try {
      const articlesForParsing = articles.map(a => ({
        id: a.id,
        name: a.name,
        sku: a.sku,
        unit: a.unit,
        supplier_name: a.suppliers?.name || '',
      }));

      const { data, error } = await supabase.functions.invoke('parse-order-text', {
        body: { text, articles: articlesForParsing },
      });

      if (error) throw error;

      if (data.items && data.items.length > 0) {
        setParsedItems(data.items);
      } else {
        toast({
          title: 'Keine Artikel erkannt',
          description: 'Bitte formuliere deine Bestellung deutlicher',
        });
      }
    } catch (error) {
      console.error('Error parsing order text:', error);
      toast({
        title: t('common.error'),
        description: 'Text konnte nicht verarbeitet werden',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async () => {
    if (parsedItems.length === 0 || !submissionType) return;

    try {
      await createSubmission.mutateAsync({
        submission_type: submissionType,
        transcription: transcription || undefined,
        items: parsedItems.map(item => ({
          recognized_text: item.recognized_text,
          article_id: item.article_id,
          quantity: item.quantity,
          confidence: item.confidence,
        })),
      });

      toast({
        title: 'Bestellung eingereicht',
        description: 'Deine Bestellung wurde zur Genehmigung eingereicht',
      });

      setParsedItems([]);
      setTranscription('');
      setSubmissionType(null);
    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: t('common.error'),
        description: 'Bestellung konnte nicht eingereicht werden',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setParsedItems([]);
    setTranscription('');
    setSubmissionType(null);
  };

  const pendingCount = allSubmissions.filter(s => s.status === 'pending').length;
  const filteredSubmissions = statusFilter === 'all' 
    ? allSubmissions 
    : allSubmissions.filter(s => s.status === statusFilter);

  const handleSubmissionClick = (submission: EmployeeOrderSubmission) => {
    setSelectedSubmission(submission);
    setReviewDialogOpen(true);
  };

  return (
    <div className="max-w-2xl mx-auto">
      
      <Tabs defaultValue="new" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`w-full mb-6 ${canSeeAllSubmissions ? 'grid-cols-3' : ''}`}>
          <TabsTrigger value="new" className="flex-1">
            {t('staffOrders.newOrder')}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            {t('staffOrders.myOrders')}
            {mySubmissions.length > 0 && (
              <Badge variant="secondary" className="ml-2">{mySubmissions.length}</Badge>
            )}
          </TabsTrigger>
          {canSeeAllSubmissions && (
            <TabsTrigger value="all" className="flex-1">
              {t('staffOrders.allOrders')}
              {pendingCount > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingCount}</Badge>
              )}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="new">
          {parsedItems.length > 0 ? (
            <StaffOrderPreview
              items={parsedItems}
              transcription={transcription}
              articles={articles}
              onItemChange={(index, item) => {
                const newItems = [...parsedItems];
                newItems[index] = item;
                setParsedItems(newItems);
              }}
              onItemRemove={(index) => {
                setParsedItems(parsedItems.filter((_, i) => i !== index));
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={createSubmission.isPending}
            />
          ) : (
            <div className="space-y-4">
              {/* Voice Recording Card */}
              <Card data-tour-step="voice">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mic className="h-5 w-5" />
                    {t('staffOrders.voice')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">{t('staffOrders.voiceDescription')}</p>
                  <Button
                    size="lg"
                    className={`w-full h-20 text-lg ${isRecording ? 'bg-destructive hover:bg-destructive/90' : ''}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                        {t('staffOrders.processing')}
                      </>
                    ) : isRecording ? (
                      <>
                        <div className="h-4 w-4 rounded-full bg-white animate-pulse mr-2" />
                        {t('staffOrders.stopRecording')}
                      </>
                    ) : (
                      <>
                        <Mic className="h-6 w-6 mr-2" />
                        {t('staffOrders.startRecording')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Photo Upload Card */}
              <Card data-tour-step="photo">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Camera className="h-5 w-5" />
                    {t('staffOrders.photo')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm mb-4">{t('staffOrders.photoDescription')}</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 h-16"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isProcessing}
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      {t('staffOrders.camera')}
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="flex-1 h-16"
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.removeAttribute('capture');
                          fileInputRef.current.click();
                          fileInputRef.current.setAttribute('capture', 'environment');
                        }
                      }}
                      disabled={isProcessing}
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      {t('staffOrders.gallery')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <StaffSubmissionHistory submissions={mySubmissions} onSubmissionClick={handleSubmissionClick} />
        </TabsContent>

        {canSeeAllSubmissions && (
          <TabsContent value="all">
            <div className="space-y-4">
              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('staffOrders.filterByStatus')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('staffOrders.allStatuses')}</SelectItem>
                    <SelectItem value="pending">{t('staffOrders.status.pending')}</SelectItem>
                    <SelectItem value="approved">{t('staffOrders.status.approved')}</SelectItem>
                    <SelectItem value="rejected">{t('staffOrders.status.rejected')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <StaffSubmissionHistory 
                submissions={filteredSubmissions} 
                onSubmissionClick={handleSubmissionClick}
                showSubmitter
              />
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Review Dialog */}
      <EmployeeSubmissionReviewDialog
        submission={selectedSubmission}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
      />
    </div>
  );
}
