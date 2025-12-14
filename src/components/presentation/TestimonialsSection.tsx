import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    quote: 'Endlich keine Excel-Listen mehr! Mein Team bestellt jetzt selbstständig per QR-Code.',
    author: '[Name]',
    role: 'Küchenchef',
    company: '[Restaurant]',
  },
  {
    quote: 'Die Ausgabenübersicht hat uns geholfen, 15% bei Lieferanten einzusparen.',
    author: '[Name]',
    role: 'Inhaber',
    company: '[Hotel]',
  },
  {
    quote: 'Meine Lieferanten pflegen ihre Preise jetzt selbst – weniger Telefonate, weniger Fehler.',
    author: '[Name]',
    role: 'F&B Manager',
    company: '[Catering]',
  },
];

export const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section id="testimonials" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Was unsere Kunden sagen
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Echte Erfahrungen von Gastronomen
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="relative">
            <Card className="p-8 md:p-12 text-center animate-fade-in">
              {/* Stars */}
              <div className="flex justify-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="text-xl md:text-2xl text-foreground mb-6 italic">
                "{testimonials[currentIndex].quote}"
              </blockquote>

              {/* Author */}
              <div className="text-muted-foreground">
                <p className="font-semibold text-foreground">
                  — {testimonials[currentIndex].author}
                </p>
                <p className="text-sm">
                  {testimonials[currentIndex].role}, {testimonials[currentIndex].company}
                </p>
              </div>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrev}
                className="rounded-full"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="rounded-full"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <p className="text-center text-sm text-primary mt-8">
            [Platzhalter – echte Testimonials einfügen]
          </p>
        </div>
      </div>
    </section>
  );
};
