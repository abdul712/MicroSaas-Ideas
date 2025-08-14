import { optimizeCaption, PLATFORM_CONSTRAINTS } from '../platform-optimizer';
import { SocialPlatform, ContentType } from '@prisma/client';

describe('Platform Optimizer', () => {
  describe('optimizeCaption', () => {
    it('should optimize caption for Instagram', () => {
      const caption = 'Check out this amazing sunset! It was absolutely beautiful today and I wanted to share it with everyone. The colors were incredible and the whole sky was painted in orange and pink hues. Nature is truly spectacular! #sunset #nature #beautiful #photography #amazing #sky #colors #evening #peaceful #landscape #outdoor #inspiration #gratitude #blessed #happy';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.optimizedCaption.length).toBeLessThanOrEqual(PLATFORM_CONSTRAINTS.INSTAGRAM.maxLength);
      expect(result.suggestedHashtags.length).toBeLessThanOrEqual(PLATFORM_CONSTRAINTS.INSTAGRAM.maxHashtags);
      expect(result.compliance.lengthCompliant).toBe(true);
      expect(result.compliance.hashtagCompliant).toBe(true);
      expect(result.score).toBeGreaterThan(60);
    });

    it('should optimize caption for Twitter with character limit', () => {
      const caption = 'This is a very long caption that definitely exceeds the Twitter character limit and needs to be truncated to fit within the platform constraints while maintaining readability and engagement.';
      
      const result = optimizeCaption(caption, SocialPlatform.TWITTER);
      
      expect(result.optimizedCaption.length).toBeLessThanOrEqual(PLATFORM_CONSTRAINTS.TWITTER.maxLength);
      expect(result.suggestedHashtags.length).toBeLessThanOrEqual(PLATFORM_CONSTRAINTS.TWITTER.maxHashtags);
      expect(result.compliance.lengthCompliant).toBe(true);
    });

    it('should optimize caption for LinkedIn with professional tone', () => {
      const caption = 'Excited to share insights from today\'s conference! #business #leadership #innovation #growth #networking';
      
      const result = optimizeCaption(caption, SocialPlatform.LINKEDIN);
      
      expect(result.suggestedHashtags).toContain('#leadership');
      expect(result.suggestedHashtags).toContain('#business');
      expect(result.score).toBeGreaterThan(70);
    });

    it('should handle TikTok caption with trending hashtags', () => {
      const caption = 'Fun dance challenge! #dance #fyp #trending';
      
      const result = optimizeCaption(caption, SocialPlatform.TIKTOK);
      
      expect(result.suggestedHashtags).toContain('#fyp');
      expect(result.suggestedHashtags).toContain('#dance');
      expect(result.suggestedHashtags.length).toBeLessThanOrEqual(PLATFORM_CONSTRAINTS.TIKTOK.maxHashtags);
    });

    it('should handle Facebook with minimal hashtags', () => {
      const caption = 'Great day with family and friends! #family #blessed #goodtimes #weekend #fun #happy #memories #grateful';
      
      const result = optimizeCaption(caption, SocialPlatform.FACEBOOK);
      
      expect(result.suggestedHashtags.length).toBeLessThanOrEqual(PLATFORM_CONSTRAINTS.FACEBOOK.optimalHashtags + 2);
      expect(result.compliance.hashtagCompliant).toBe(true);
    });
  });

  describe('Content Type Optimization', () => {
    it('should adjust optimization for video content', () => {
      const caption = 'Watch this amazing tutorial!';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM, ContentType.VIDEO);
      
      expect(result.optimizedCaption).toContain(caption);
      expect(result.score).toBeGreaterThan(50);
    });

    it('should adjust optimization for story content', () => {
      const caption = 'Quick behind the scenes look! #bts #work';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM, ContentType.STORY);
      
      expect(result.suggestedHashtags.length).toBeLessThanOrEqual(5);
    });

    it('should optimize carousel posts', () => {
      const caption = 'Swipe to see all the amazing moments from today! Each slide tells a story.';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM, ContentType.CAROUSEL);
      
      expect(result.optimizedCaption.length).toBeLessThan(150); // Carousel should be more concise
    });
  });

  describe('Hashtag Generation', () => {
    it('should extract existing hashtags', () => {
      const caption = 'Beautiful day! #sunny #happy #blessed';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.suggestedHashtags).toContain('#sunny');
      expect(result.suggestedHashtags).toContain('#happy');
      expect(result.suggestedHashtags).toContain('#blessed');
    });

    it('should generate relevant hashtags from content', () => {
      const caption = 'Amazing workout session at the gym today! Feeling strong and energized.';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.suggestedHashtags.some(tag => 
        tag.includes('workout') || tag.includes('gym') || tag.includes('fitness')
      )).toBe(true);
    });

    it('should include brand hashtags when provided', () => {
      const caption = 'New product launch!';
      const options = {
        includeHashtags: true,
        brandHashtags: ['mybrand', 'innovation', 'newlaunch']
      };
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM, ContentType.IMAGE, options);
      
      expect(result.suggestedHashtags).toContain('#mybrand');
      expect(result.suggestedHashtags).toContain('#innovation');
      expect(result.suggestedHashtags).toContain('#newlaunch');
    });

    it('should add industry-specific hashtags', () => {
      const caption = 'New recipe for healthy smoothies!';
      const options = {
        industry: 'food'
      };
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM, ContentType.IMAGE, options);
      
      expect(result.suggestedHashtags.some(tag => 
        ['#food', '#recipe', '#cooking', '#delicious', '#foodie'].includes(tag)
      )).toBe(true);
    });
  });

  describe('Engagement Features', () => {
    it('should detect call-to-action in captions', () => {
      const caption = 'Click the link in bio to learn more about our new service!';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.score).toBeGreaterThan(70); // CTA should increase score
    });

    it('should detect questions for engagement', () => {
      const caption = 'What do you think about this new trend? Let me know in the comments!';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.score).toBeGreaterThan(70); // Questions should increase score
    });

    it('should detect emojis', () => {
      const caption = 'Beautiful sunset today! 🌅✨ So peaceful and amazing! 😍';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.score).toBeGreaterThan(70); // Emojis should increase score
    });

    it('should detect mentions', () => {
      const caption = 'Great collaboration with @partner today! Thank you for the amazing work.';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.score).toBeGreaterThan(60); // Mentions should contribute to score
    });
  });

  describe('Length Optimization', () => {
    it('should truncate overly long captions', () => {
      const longCaption = 'A'.repeat(3000); // Way over Instagram limit
      
      const result = optimizeCaption(longCaption, SocialPlatform.INSTAGRAM);
      
      expect(result.optimizedCaption.length).toBeLessThanOrEqual(PLATFORM_CONSTRAINTS.INSTAGRAM.maxLength);
      expect(result.compliance.lengthCompliant).toBe(true);
    });

    it('should preserve sentence boundaries when truncating', () => {
      const caption = 'First sentence is here. Second sentence is much longer and contains more details. Third sentence should probably be cut off to maintain the character limit.';
      
      const result = optimizeCaption(caption, SocialPlatform.TWITTER);
      
      expect(result.optimizedCaption).toMatch(/\.\s*$/); // Should end with sentence
      expect(result.optimizedCaption.length).toBeLessThanOrEqual(PLATFORM_CONSTRAINTS.TWITTER.maxLength);
    });

    it('should handle very short captions', () => {
      const caption = 'Hi!';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.suggestions).toContain(expect.stringContaining('might be too short'));
      expect(result.score).toBeLessThan(80); // Short captions should have lower scores
    });
  });

  describe('Platform-Specific Features', () => {
    it('should remove line breaks for Pinterest', () => {
      const caption = 'Line one\nLine two\nLine three';
      
      const result = optimizeCaption(caption, SocialPlatform.PINTEREST);
      
      expect(result.optimizedCaption).not.toContain('\n');
      expect(result.optimizedCaption).toBe('Line one Line two Line three');
    });

    it('should preserve line breaks for Instagram', () => {
      const caption = 'Line one\n\nLine three';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.optimizedCaption).toContain('\n');
    });

    it('should suggest more hashtags for Pinterest', () => {
      const caption = 'Beautiful home decor inspiration';
      
      const result = optimizeCaption(caption, SocialPlatform.PINTEREST);
      
      expect(result.suggestedHashtags.length).toBeGreaterThanOrEqual(8);
      expect(result.suggestedHashtags.some(tag => 
        ['#diy', '#home', '#decor', '#inspiration', '#design'].includes(tag)
      )).toBe(true);
    });
  });

  describe('Compliance Checking', () => {
    it('should mark non-compliant lengthy captions', () => {
      const caption = 'A'.repeat(300); // Over Twitter limit
      
      const result = optimizeCaption(caption, SocialPlatform.TWITTER);
      
      if (result.optimizedCaption.length > PLATFORM_CONSTRAINTS.TWITTER.maxLength) {
        expect(result.compliance.lengthCompliant).toBe(false);
      }
    });

    it('should mark non-compliant hashtag count', () => {
      const manyHashtags = Array.from({length: 35}, (_, i) => `#tag${i}`).join(' ');
      const caption = `Great post! ${manyHashtags}`;
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      if (result.suggestedHashtags.length > PLATFORM_CONSTRAINTS.INSTAGRAM.maxHashtags) {
        expect(result.compliance.hashtagCompliant).toBe(false);
      }
    });
  });

  describe('Scoring System', () => {
    it('should give high scores to well-optimized captions', () => {
      const caption = 'Amazing workout today! 💪 What\'s your favorite exercise? Click link in bio for more tips! #fitness #health #motivation #workout #gym #strong #exercise #wellness #fit #training #lifestyle';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.score).toBeGreaterThan(80);
    });

    it('should give low scores to poorly optimized captions', () => {
      const caption = 'ok';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.score).toBeLessThan(60);
    });

    it('should consider platform-specific optimal lengths', () => {
      const optimalCaption = 'A'.repeat(PLATFORM_CONSTRAINTS.INSTAGRAM.optimalLength);
      
      const result = optimizeCaption(optimalCaption, SocialPlatform.INSTAGRAM);
      
      expect(result.score).toBeGreaterThan(70);
    });
  });

  describe('Error Handling', () => {
    it('should handle empty captions', () => {
      const result = optimizeCaption('', SocialPlatform.INSTAGRAM);
      
      expect(result.optimizedCaption).toBe('');
      expect(result.suggestedHashtags).toEqual([]);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle captions with only special characters', () => {
      const caption = '!@#$%^&*()';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.optimizedCaption).toBe(caption);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle captions with only emojis', () => {
      const caption = '😀😍🎉🌟✨';
      
      const result = optimizeCaption(caption, SocialPlatform.INSTAGRAM);
      
      expect(result.optimizedCaption).toBe(caption);
      expect(result.score).toBeGreaterThan(0);
    });
  });
});