import { useState } from 'react';
import { Settings, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ParticleConfig, DEFAULT_PARTICLE_CONFIG, PARTICLE_PRESETS } from './particleConfig';

interface ParticleConfigPanelProps {
  config: ParticleConfig;
  onChange: (config: ParticleConfig) => void;
}

interface ConfigSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

function ConfigSlider({ label, value, min, max, step, unit = '', onChange }: ConfigSliderProps) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <span className="text-xs font-mono text-foreground">{value}{unit}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}

export function ParticleConfigPanel({ config, onChange }: ParticleConfigPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const updateConfig = (key: keyof ParticleConfig, value: number) => {
    onChange({ ...config, [key]: value });
  };

  const resetToDefault = () => {
    onChange(DEFAULT_PARTICLE_CONFIG);
  };

  const applyPreset = (preset: keyof typeof PARTICLE_PRESETS) => {
    onChange(PARTICLE_PRESETS[preset]);
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-48 z-50 bg-card/80 backdrop-blur-sm h-9 w-9"
        title="Partikel-Einstellungen"
      >
        <Settings className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="absolute top-4 right-48 z-50 bg-card/95 backdrop-blur-sm rounded-lg border shadow-lg w-72 max-h-[calc(100vh-120px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b sticky top-0 bg-card/95 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Partikel-Einstellungen</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={resetToDefault}
            className="h-7 w-7"
            title="Zurücksetzen"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Presets */}
      <div className="p-3 border-b">
        <Label className="text-xs text-muted-foreground mb-2 block">Vorlagen</Label>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(PARTICLE_PRESETS).map((preset) => (
            <Button
              key={preset}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset as keyof typeof PARTICLE_PRESETS)}
              className="text-xs h-7 px-2"
            >
              {preset === 'default' ? 'Standard' : 
               preset === 'fast' ? 'Schnell' :
               preset === 'slow' ? 'Langsam' :
               preset === 'large' ? 'Groß' :
               preset === 'subtle' ? 'Dezent' : preset}
            </Button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="p-3 space-y-4">
        {/* Animation Section */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-primary border-b pb-1">Animation</div>
          <ConfigSlider
            label="Geschwindigkeit"
            value={config.duration}
            min={300}
            max={3000}
            step={100}
            unit="ms"
            onChange={(v) => updateConfig('duration', v)}
          />
          <ConfigSlider
            label="Pulsier-Stärke"
            value={config.pulseIntensity}
            min={0}
            max={0.5}
            step={0.01}
            onChange={(v) => updateConfig('pulseIntensity', v)}
          />
        </div>

        {/* Size Section */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-primary border-b pb-1">Größen</div>
          <ConfigSlider
            label="Hauptpartikel"
            value={config.mainParticleSize}
            min={8}
            max={50}
            step={1}
            unit="px"
            onChange={(v) => updateConfig('mainParticleSize', v)}
          />
          <ConfigSlider
            label="Kern"
            value={config.coreSize}
            min={4}
            max={30}
            step={1}
            unit="px"
            onChange={(v) => updateConfig('coreSize', v)}
          />
          <ConfigSlider
            label="Trail 1 (klein)"
            value={config.trail1Size}
            min={4}
            max={30}
            step={1}
            unit="px"
            onChange={(v) => updateConfig('trail1Size', v)}
          />
          <ConfigSlider
            label="Trail 2 (mittel)"
            value={config.trail2Size}
            min={4}
            max={40}
            step={1}
            unit="px"
            onChange={(v) => updateConfig('trail2Size', v)}
          />
        </div>

        {/* Styling Section */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-primary border-b pb-1">Styling</div>
          <ConfigSlider
            label="Randdicke"
            value={config.strokeWidth}
            min={1}
            max={10}
            step={0.5}
            unit="px"
            onChange={(v) => updateConfig('strokeWidth', v)}
          />
          <ConfigSlider
            label="Glow-Stärke"
            value={config.glowBlur}
            min={0}
            max={25}
            step={1}
            onChange={(v) => updateConfig('glowBlur', v)}
          />
        </div>

        {/* Trail Offsets Section */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-primary border-b pb-1">Trail-Abstände</div>
          <ConfigSlider
            label="Trail 1 Abstand"
            value={config.trailOffset1}
            min={0.02}
            max={0.3}
            step={0.01}
            onChange={(v) => updateConfig('trailOffset1', v)}
          />
          <ConfigSlider
            label="Trail 2 Abstand"
            value={config.trailOffset2}
            min={0.04}
            max={0.5}
            step={0.01}
            onChange={(v) => updateConfig('trailOffset2', v)}
          />
        </div>

        {/* Opacity Section */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-primary border-b pb-1">Transparenz</div>
          <ConfigSlider
            label="Trail 1"
            value={config.trail1Opacity}
            min={0.1}
            max={1}
            step={0.05}
            onChange={(v) => updateConfig('trail1Opacity', v)}
          />
          <ConfigSlider
            label="Trail 2"
            value={config.trail2Opacity}
            min={0.1}
            max={1}
            step={0.05}
            onChange={(v) => updateConfig('trail2Opacity', v)}
          />
          <ConfigSlider
            label="Kern"
            value={config.coreOpacity}
            min={0.1}
            max={1}
            step={0.05}
            onChange={(v) => updateConfig('coreOpacity', v)}
          />
        </div>
      </div>
    </div>
  );
}
