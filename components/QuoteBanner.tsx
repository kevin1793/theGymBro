import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function QuoteBanner() {
  const [visible, setVisible] = useState(true);
  
  const quotes = [
    "Push yourself because no one else will do it for you.",
    "The only bad workout is the one you didn’t do.",
    "Sweat now, shine later.",
    "Your body can do it — it’s your mind you have to convince.",
    "Strength grows in the moments you think you can’t go on but keep going.",
    "Train insane or remain the same.",
    "Don’t count the days — make the days count.",
    "A one‑hour workout is 4% of your day. No excuses.",
    "It never gets easier, you just get stronger.",
    "Work hard in silence. Let success make the noise.",
    "Progress is progress, no matter how small.",
    "Today’s effort becomes tomorrow’s results.",
    "Set goals. Crush them. Repeat.",
    "Every rep is a step closer to your goal.",
    "Small improvement every day adds up to big results.",
    "Success isn’t overnight — it’s when every day you get a little better.",
    "Measure progress in effort, not perfection.",
    "Discipline creates results.",
    "You don’t get stronger by staying comfortable.",
    "Strength is built one workout at a time.",
    "Your mind gives up before your body does.",
    "What you think, you become — so think strong.",
    "The pain you feel today is the strength you feel tomorrow.",
    "Don’t let fear decide your future.",
    "The only limits in life are the ones you set yourself.",
    "It’s a slow process — but quitting won’t speed it up.",
    "Your mindset determines your success.",
    "Mental strength is fighting without seeing the finish line.",
    "Consistency builds confidence.",
    "Excuses cost more than hard work.",
    "Take care of your body — it’s the only place you live.",
    "Health is a lifetime investment.",
    "Wellness is the natural state of my body.",
    "Strong body, strong mind.",
    "Eat well. Move often. Sleep well.",
    "Fitness is not a destination — it’s a lifestyle.",
    "The best project you’ll ever work on is you.",
    "Nourish to flourish.",
    "Movement is medicine.",
    "Your habits define your health.",
    "You are stronger than you think.",
    "Believe you can and you’re halfway there.",
    "Optimism is a magnet for miracles.",
    "Turn your can’ts into cans.",
    "Great things never come from comfort zones.",
    "You miss 100% of the shots you don’t take.",
    "Challenges are opportunities in disguise.",
    "Positive thoughts. Positive life.",
    "Bravery is believing in yourself when others doubt you.",
    "Your vibe attracts your tribe.",
    "When it hurts, that means it’s working.",
    "Fail. Learn. Improve. Repeat.",
    "Greatness begins beyond your comfort.",
    "Don’t quit — restart, rethink, adjust.",
    "The comeback is always stronger than the setback.",
    "Prove them wrong.",
    "Be stronger than your strongest excuse.",
    "It’s not about being the best — it’s about being better than yesterday.",
    "Every setback is a setup for a comeback.",
    "The journey is the reward.",
    "Do something today that your future self will thank you for.",
    "Start where you are. Use what you have.",
    "Today is another chance to get it right.",
    "Make your future self proud.",
    "You don’t have to be perfect — just consistent.",
    "Small steps become big changes.",
    "Don’t wait for motivation — create it.",
    "Today’s choices shape tomorrow’s results.",
    "The grind builds character.",
    "Don’t stop until you’re proud.",
    "Love yourself enough to live a healthy life.",
    "You are capable of amazing things.",
    "Your worth is not defined by your weight.",
    "Confidence is built one habit at a time.",
    "Respect your body — it’s doing its best.",
    "You are more than enough.",
    "Be kind to your body and mind.",
    "Strength is beautiful.",
    "Your only competition is you.",
    "Believe in your infinite potential.",
    "Focus on progress, not perfection.",
    "The struggle you’re in today is developing strength for tomorrow.",
    "Limitations exist only in your mind.",
    "Success starts with a decision.",
    "What you practice is what you become.",
    "Your only limit is you.",
    "Turn fear into fuel.",
    "More effort = more results.",
    "Rise with purpose.",
    "Your dreams don’t work unless you do.",
    "Your life gets better when you get better.",
    "Action conquers fear.",
    "Be fearless in the pursuit of what sets your soul on fire.",
    "Be stronger than your excuses.",
    "The best time to start was yesterday. The next best time is now.",
    "Success is built one day at a time.",
    "Stop wishing. Start doing.",
    "Hard work beats talent when talent doesn’t work hard.",
    "Your potential is endless.",
    "Dream big. Work hard. Stay humble."
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  if (!visible) return null;

  return (
    <View style={styles.banner}>
      {/* Close button */}
      <Pressable onPress={() => setVisible(false)} style={styles.closeButton}>
        <Text style={styles.close}>✕</Text>
      </Pressable>

      {/* Quote label */}
      <Text style={styles.label}>Quote of the day</Text>

      {/* Quote text */}
      <Text style={styles.text}>{randomQuote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#2a2a2a',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    position: 'relative', // for positioning close button
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 1,
  },
  close: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  text: {
    color: '#fff',
    fontSize: 14,
  },
});
