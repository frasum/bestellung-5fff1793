import { useState, useCallback, useMemo } from 'react';

// Simplified wine interface for quiz - works with both Article and WineCatalogView wines
export interface QuizWine {
  id: string;
  name: string;
  description?: string | null;
  grape_variety?: string | null;
  origin_country?: string | null;
  flavor_profile?: string | null;
  food_pairings?: string | null;
  selling_price?: number | null;
  image_url?: string | null;
  category?: string | null;
}

export interface QuizQuestion {
  id: string;
  type: 'grape' | 'origin' | 'flavor' | 'pairing' | 'price' | 'image';
  question: string;
  correctAnswer: string;
  options: string[];
  wine: QuizWine;
  hint?: string;
}

export interface QuizState {
  currentLevel: number;
  score: number;
  questionsAnswered: number;
  correctAnswers: number;
  currentQuestion: QuizQuestion | null;
  usedJokers: {
    fiftyFifty: boolean;
    audience: boolean;
    phone: boolean;
  };
  eliminatedOptions: string[];
  audienceVotes: Record<string, number> | null;
  phoneHint: string | null;
  isGameOver: boolean;
  isWinner: boolean;
  safeLevel: number;
}

// Points per level (WWM style - increasing value)
export const LEVEL_POINTS = [
  50, 100, 200, 300, 500,      // Levels 1-5 (Bronze)
  1000, 2000, 4000, 8000, 16000, // Levels 6-10 (Silver)
  32000, 64000, 125000, 500000, 1000000 // Levels 11-15 (Gold)
];

export const SAFE_LEVELS = [5, 10, 15]; // Bronze, Silver, Gold

export const useWineQuiz = (wines: QuizWine[]) => {
  const [state, setState] = useState<QuizState>({
    currentLevel: 0,
    score: 0,
    questionsAnswered: 0,
    correctAnswers: 0,
    currentQuestion: null,
    usedJokers: { fiftyFifty: false, audience: false, phone: false },
    eliminatedOptions: [],
    audienceVotes: null,
    phoneHint: null,
    isGameOver: false,
    isWinner: false,
    safeLevel: 0,
  });

  // Filter wines that have enough data for quiz
  const validWines = useMemo(() => {
    return wines.filter(w => 
      w.name && 
      (w.grape_variety || w.origin_country || w.flavor_profile || w.food_pairings || w.selling_price)
    );
  }, [wines]);

  // Get random wine from list (excluding current)
  const getRandomWine = useCallback((exclude?: QuizWine): QuizWine | null => {
    const available = exclude 
      ? validWines.filter(w => w.id !== exclude.id)
      : validWines;
    if (available.length === 0) return null;
    return available[Math.floor(Math.random() * available.length)];
  }, [validWines]);

  // Get random wrong answers for a field
  const getWrongAnswers = useCallback((correctWine: QuizWine, field: keyof QuizWine, count: number): string[] => {
    const wrongAnswers: string[] = [];
    const usedValues = new Set([correctWine[field] as string]);
    
    const shuffled = [...validWines].sort(() => Math.random() - 0.5);
    for (const wine of shuffled) {
      const value = wine[field as keyof QuizWine] as string;
      if (value && !usedValues.has(value)) {
        wrongAnswers.push(value);
        usedValues.add(value);
        if (wrongAnswers.length >= count) break;
      }
    }
    
    // If not enough unique answers, add generic ones
    const genericAnswers: Record<string, string[]> = {
      grape_variety: ['Merlot', 'Cabernet Sauvignon', 'Chardonnay', 'Pinot Noir', 'Riesling', 'Sauvignon Blanc'],
      origin_country: ['Frankreich', 'Italien', 'Spanien', 'Deutschland', 'Österreich', 'Chile', 'Argentinien'],
      flavor_profile: ['Fruchtig und leicht', 'Trocken und tanninreich', 'Süß und aromatisch', 'Mineralisch und frisch'],
      food_pairings: ['Pasta', 'Steak', 'Fisch', 'Käse', 'Desserts', 'Vorspeisen'],
    };
    
    while (wrongAnswers.length < count && genericAnswers[field as string]) {
      const generic = genericAnswers[field as string].find(g => !usedValues.has(g));
      if (generic) {
        wrongAnswers.push(generic);
        usedValues.add(generic);
      } else break;
    }
    
    return wrongAnswers.slice(0, count);
  }, [validWines]);

  // Generate price range options
  const getPriceOptions = useCallback((correctPrice: number): string[] => {
    const ranges = [
      { min: 0, max: 20, label: 'Unter 20€' },
      { min: 20, max: 40, label: '20-40€' },
      { min: 40, max: 60, label: '40-60€' },
      { min: 60, max: 100, label: '60-100€' },
      { min: 100, max: Infinity, label: 'Über 100€' },
    ];
    
    const correctRange = ranges.find(r => correctPrice >= r.min && correctPrice < r.max);
    if (!correctRange) return ranges.map(r => r.label);
    
    // Shuffle and pick 4 including correct
    const options = [correctRange.label];
    const otherRanges = ranges.filter(r => r.label !== correctRange.label).sort(() => Math.random() - 0.5);
    options.push(...otherRanges.slice(0, 3).map(r => r.label));
    
    return options.sort(() => Math.random() - 0.5);
  }, []);

  // Generate a question based on level difficulty
  const generateQuestion = useCallback((): QuizQuestion | null => {
    if (validWines.length < 4) return null;
    
    const wine = getRandomWine();
    if (!wine) return null;
    
    const level = state.currentLevel;
    const questionTypes: Array<{ type: QuizQuestion['type']; field: keyof QuizWine; weight: number }> = [];
    
    // Add available question types based on wine data
    if (wine.grape_variety) questionTypes.push({ type: 'grape', field: 'grape_variety', weight: 2 });
    if (wine.origin_country) questionTypes.push({ type: 'origin', field: 'origin_country', weight: 2 });
    if (wine.flavor_profile) questionTypes.push({ type: 'flavor', field: 'flavor_profile', weight: 1 });
    if (wine.food_pairings) questionTypes.push({ type: 'pairing', field: 'food_pairings', weight: 1 });
    if (wine.selling_price) questionTypes.push({ type: 'price', field: 'selling_price', weight: 1 });
    if (wine.image_url) questionTypes.push({ type: 'image', field: 'name', weight: level > 5 ? 2 : 1 });
    
    if (questionTypes.length === 0) return generateQuestion(); // Try another wine
    
    // Weighted random selection
    const totalWeight = questionTypes.reduce((sum, qt) => sum + qt.weight, 0);
    let random = Math.random() * totalWeight;
    let selected = questionTypes[0];
    for (const qt of questionTypes) {
      random -= qt.weight;
      if (random <= 0) {
        selected = qt;
        break;
      }
    }
    
    let question: string;
    let correctAnswer: string;
    let options: string[];
    let hint: string | undefined;
    
    switch (selected.type) {
      case 'grape':
        question = `Welche Rebsorte hat der "${wine.name}"?`;
        correctAnswer = wine.grape_variety!;
        options = [correctAnswer, ...getWrongAnswers(wine, 'grape_variety', 3)];
        hint = wine.description?.substring(0, 100);
        break;
      case 'origin':
        question = `Aus welchem Land kommt der "${wine.name}"?`;
        correctAnswer = wine.origin_country!;
        options = [correctAnswer, ...getWrongAnswers(wine, 'origin_country', 3)];
        hint = wine.grape_variety ? `Rebsorte: ${wine.grape_variety}` : undefined;
        break;
      case 'flavor':
        question = `Wie wird das Geschmacksprofil des "${wine.name}" beschrieben?`;
        correctAnswer = wine.flavor_profile!;
        options = [correctAnswer, ...getWrongAnswers(wine, 'flavor_profile', 3)];
        hint = wine.origin_country ? `Herkunft: ${wine.origin_country}` : undefined;
        break;
      case 'pairing':
        question = `Welche Speise passt am besten zum "${wine.name}"?`;
        correctAnswer = wine.food_pairings!;
        options = [correctAnswer, ...getWrongAnswers(wine, 'food_pairings', 3)];
        hint = wine.flavor_profile ? `Geschmack: ${wine.flavor_profile}` : undefined;
        break;
      case 'price':
        question = `In welcher Preisklasse liegt der "${wine.name}"?`;
        const price = wine.selling_price!;
        if (price < 20) correctAnswer = 'Unter 20€';
        else if (price < 40) correctAnswer = '20-40€';
        else if (price < 60) correctAnswer = '40-60€';
        else if (price < 100) correctAnswer = '60-100€';
        else correctAnswer = 'Über 100€';
        options = getPriceOptions(price);
        hint = wine.origin_country ? `${wine.origin_country}, ${wine.grape_variety || 'verschiedene Rebsorten'}` : undefined;
        break;
      case 'image':
        question = 'Welcher Wein ist auf diesem Bild zu sehen?';
        correctAnswer = wine.name;
        const otherWines = validWines.filter(w => w.id !== wine.id).sort(() => Math.random() - 0.5).slice(0, 3);
        options = [correctAnswer, ...otherWines.map(w => w.name)];
        hint = wine.grape_variety ? `Rebsorte: ${wine.grape_variety}` : undefined;
        break;
    }
    
    // Shuffle options
    options = options.sort(() => Math.random() - 0.5);
    
    return {
      id: `${wine.id}-${Date.now()}`,
      type: selected.type,
      question,
      correctAnswer,
      options,
      wine,
      hint,
    };
  }, [validWines, state.currentLevel, getRandomWine, getWrongAnswers, getPriceOptions]);

  // Start new game
  const startGame = useCallback(() => {
    const firstQuestion = generateQuestion();
    setState({
      currentLevel: 1,
      score: 0,
      questionsAnswered: 0,
      correctAnswers: 0,
      currentQuestion: firstQuestion,
      usedJokers: { fiftyFifty: false, audience: false, phone: false },
      eliminatedOptions: [],
      audienceVotes: null,
      phoneHint: null,
      isGameOver: false,
      isWinner: false,
      safeLevel: 0,
    });
  }, [generateQuestion]);

  // Answer question
  const answerQuestion = useCallback((answer: string) => {
    if (!state.currentQuestion || state.isGameOver) return;
    
    const isCorrect = answer === state.currentQuestion.correctAnswer;
    const newLevel = isCorrect ? state.currentLevel + 1 : state.currentLevel;
    const newCorrectAnswers = isCorrect ? state.correctAnswers + 1 : state.correctAnswers;
    
    // Calculate safe level
    let safeLevel = state.safeLevel;
    if (isCorrect) {
      for (const level of SAFE_LEVELS) {
        if (newLevel > level) safeLevel = level;
      }
    }
    
    // Calculate score
    let newScore = state.score;
    if (isCorrect) {
      newScore += LEVEL_POINTS[state.currentLevel - 1] || 0;
    } else {
      // Fall back to safe level score
      const safePoints = safeLevel > 0 ? LEVEL_POINTS[safeLevel - 1] : 0;
      newScore = safePoints;
    }
    
    const isWinner = isCorrect && newLevel > 15;
    const isGameOver = !isCorrect || isWinner;
    
    // Generate next question if game continues
    const nextQuestion = isGameOver ? state.currentQuestion : generateQuestion();
    
    setState(prev => ({
      ...prev,
      currentLevel: isCorrect ? newLevel : prev.currentLevel,
      score: newScore,
      questionsAnswered: prev.questionsAnswered + 1,
      correctAnswers: newCorrectAnswers,
      currentQuestion: nextQuestion,
      safeLevel,
      isGameOver,
      isWinner,
      eliminatedOptions: [],
      audienceVotes: null,
      phoneHint: null,
    }));
    
    return isCorrect;
  }, [state, generateQuestion]);

  // Use 50:50 Joker
  const useFiftyFifty = useCallback(() => {
    if (state.usedJokers.fiftyFifty || !state.currentQuestion) return;
    
    const wrongOptions = state.currentQuestion.options.filter(
      o => o !== state.currentQuestion!.correctAnswer
    );
    const toEliminate = wrongOptions.sort(() => Math.random() - 0.5).slice(0, 2);
    
    setState(prev => ({
      ...prev,
      usedJokers: { ...prev.usedJokers, fiftyFifty: true },
      eliminatedOptions: toEliminate,
    }));
  }, [state.usedJokers.fiftyFifty, state.currentQuestion]);

  // Use Audience Joker
  const useAudience = useCallback(() => {
    if (state.usedJokers.audience || !state.currentQuestion) return;
    
    // Simulate audience votes (correct answer gets 40-70%)
    const correctPercent = 40 + Math.random() * 30;
    const remaining = 100 - correctPercent;
    const wrongOptions = state.currentQuestion.options.filter(
      o => o !== state.currentQuestion!.correctAnswer && !state.eliminatedOptions.includes(o)
    );
    
    const votes: Record<string, number> = {};
    votes[state.currentQuestion.correctAnswer] = Math.round(correctPercent);
    
    let remainingPercent = remaining;
    wrongOptions.forEach((opt, i) => {
      if (i === wrongOptions.length - 1) {
        votes[opt] = Math.round(remainingPercent);
      } else {
        const share = Math.random() * remainingPercent * 0.6;
        votes[opt] = Math.round(share);
        remainingPercent -= share;
      }
    });
    
    setState(prev => ({
      ...prev,
      usedJokers: { ...prev.usedJokers, audience: true },
      audienceVotes: votes,
    }));
  }, [state.usedJokers.audience, state.currentQuestion, state.eliminatedOptions]);

  // Use Phone Joker
  const usePhone = useCallback(() => {
    if (state.usedJokers.phone || !state.currentQuestion) return;
    
    const hint = state.currentQuestion.hint || 
      `Ich bin mir ziemlich sicher, dass es "${state.currentQuestion.correctAnswer}" ist.`;
    
    setState(prev => ({
      ...prev,
      usedJokers: { ...prev.usedJokers, phone: true },
      phoneHint: hint,
    }));
  }, [state.usedJokers.phone, state.currentQuestion]);

  // Take the money (quit with current score)
  const takeTheMoney = useCallback(() => {
    setState(prev => ({
      ...prev,
      isGameOver: true,
      isWinner: false,
    }));
  }, []);

  return {
    state,
    validWinesCount: validWines.length,
    startGame,
    answerQuestion,
    useFiftyFifty,
    useAudience,
    usePhone,
    takeTheMoney,
  };
};
