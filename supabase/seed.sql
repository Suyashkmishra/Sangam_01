-- ==============================================================================
-- SANGAM (संगम) SEED DATA
-- Fictional Artists, Multilingual Posts, Interactions & Demo Accounts
-- ==============================================================================

-- Temporarily bypass RLS/privilege checks during deterministic database seeding
ALTER TABLE public.profiles DISABLE TRIGGER trg_protect_profile_privileges;

-- 1. SEED PROFILES
-- Demo Accounts:
-- Admin: a0000000-0000-0000-0000-000000000001 (admin.demo@sangam.test)
-- Guru:  b0000000-0000-0000-0000-000000000001 (guru.demo@sangam.test)
-- Shishya: c0000000-0000-0000-0000-000000000001 (shishya.demo@sangam.test)

INSERT INTO public.profiles (id, role, full_name, bio, city, languages, avatar_url, guru_status, is_verified, created_at)
VALUES
    -- Admin
    ('a0000000-0000-0000-0000-000000000001', 'admin', 'Sangam Admin', 'Curator & guardian of Sangam artistic lineages and mentor verifications.', 'Varanasi', ARRAY['Hindi', 'English', 'Kannada'], null, 'approved', true, now()),

    -- 5 Approved Verified Gurus
    ('b0000000-0000-0000-0000-000000000001', 'guru', 'Pandit Devavrata Shastri', 'Exponent of Classical Dhrupad and meditative Hindi chhand poetry with four decades of riyaz and teaching.', 'Prayagraj', ARRAY['Hindi', 'English'], null, 'approved', true, now() - INTERVAL '60 days'),
    ('b0000000-0000-0000-0000-000000000002', 'guru', 'Vidushi Malavika Sundaram', 'Carnatic vocal teacher & Kannada bhavageethe composer exploring ancient metric resonance.', 'Bengaluru', ARRAY['Kannada', 'English'], null, 'approved', true, now() - INTERVAL '50 days'),
    ('b0000000-0000-0000-0000-000000000003', 'guru', 'Ustad Zeeshan Farooqui', 'Master of classical Nazm recitation and meditative Sarod acoustic textures.', 'Lucknow', ARRAY['Hindi', 'English'], null, 'approved', true, now() - INTERVAL '40 days'),
    ('b0000000-0000-0000-0000-000000000004', 'guru', 'Acharya Someshwar Bhat', 'Kannada Sahitya scholar and Bansuri craftsman dedicated to mentoring young lyricists.', 'Dharwad', ARRAY['Kannada', 'Hindi'], null, 'approved', true, now() - INTERVAL '30 days'),
    ('b0000000-0000-0000-0000-000000000005', 'guru', 'Dr. Evelyn Roy', 'Contemporary mystic poet, acoustic cellist, and comparative Indian literature researcher.', 'Shillong', ARRAY['English'], null, 'approved', true, now() - INTERVAL '20 days'),

    -- 1 Pending Guru (Awaiting admin approval)
    ('b0000000-0000-0000-0000-000000000006', 'guru', 'Tarun Sengupta', 'Acoustic folk-rock composer and Hindi lyricist seeking to mentor college songwriters.', 'Bhopal', ARRAY['Hindi', 'English'], null, 'pending', false, now() - INTERVAL '2 days'),

    -- 10 Emerging Shishyas (Young Talents)
    ('c0000000-0000-0000-0000-000000000001', 'shishya', 'Aarav Neelkanth', 'College student exploring Hindi free-verse poetry, ghazals, and acoustic fingerstyle guitar.', 'Jaipur', ARRAY['Hindi', 'English'], null, 'none', false, now() - INTERVAL '15 days'),
    ('c0000000-0000-0000-0000-000000000002', 'shishya', 'Ananya Sharma', 'Undergraduate researcher writing Hindi romantic nazms and folk melodies.', 'Lucknow', ARRAY['Hindi'], null, 'none', false, now() - INTERVAL '14 days'),
    ('c0000000-0000-0000-0000-000000000003', 'shishya', 'Chetan Kumar', 'Passionate about modern Kannada vachana poetry and folk ballad vocals.', 'Hubli', ARRAY['Kannada'], null, 'none', false, now() - INTERVAL '13 days'),
    ('c0000000-0000-0000-0000-000000000004', 'shishya', 'Tanya Mukherjee', 'Spoken word artist and acoustic guitarist blending English verses with Indian rhythmic beats.', 'Kolkata', ARRAY['English'], null, 'none', false, now() - INTERVAL '12 days'),
    ('c0000000-0000-0000-0000-000000000005', 'shishya', 'Kabir Varma', 'Devotee of classical Hindi dohas and modern social commentary verses.', 'Varanasi', ARRAY['Hindi', 'English'], null, 'none', false, now() - INTERVAL '11 days'),
    ('c0000000-0000-0000-0000-000000000006', 'shishya', 'Lavanya Rao', 'Kannada poetess and sitar apprentice composing meditative evening melodies.', 'Mysuru', ARRAY['Kannada', 'English'], null, 'none', false, now() - INTERVAL '10 days'),
    ('c0000000-0000-0000-0000-000000000007', 'shishya', 'Nikhil D’Souza', 'Indie singer-songwriter capturing monsoon feelings with nylon strings.', 'Panaji', ARRAY['English'], null, 'none', false, now() - INTERVAL '9 days'),
    ('c0000000-0000-0000-0000-000000000008', 'shishya', 'Meera Chandran', 'Writer of quiet English sonnets and acoustic violin loops.', 'Kochi', ARRAY['English'], null, 'none', false, now() - INTERVAL '8 days'),
    ('c0000000-0000-0000-0000-000000000009', 'shishya', 'Vignesh Hegde', 'North Karnataka rural folk performer and poet exploring Yakshagana rhythms.', 'Shimoga', ARRAY['Kannada'], null, 'none', false, now() - INTERVAL '7 days'),
    ('c0000000-0000-0000-0000-000000000010', 'shishya', 'Riya Saxena', 'Hindi lyricist blending classical thumri echoes with acoustic ukulele melodies.', 'Indore', ARRAY['Hindi', 'English'], null, 'none', false, now() - INTERVAL '6 days')
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    bio = EXCLUDED.bio,
    city = EXCLUDED.city,
    languages = EXCLUDED.languages,
    guru_status = EXCLUDED.guru_status,
    is_verified = EXCLUDED.is_verified;

-- Re-enable privilege protection trigger
ALTER TABLE public.profiles ENABLE TRIGGER trg_protect_profile_privileges;

-- 2. SEED PROFILE CONTACTS (Locked behind accepted connection RLS)
INSERT INTO public.profile_contacts (user_id, contact_whatsapp, contact_instagram, contact_email, preferred_channel)
VALUES
    ('c0000000-0000-0000-0000-000000000001', '+91 98290 12345', '@aarav_poetry', 'shishya.demo@sangam.test', 'whatsapp'),
    ('c0000000-0000-0000-0000-000000000002', '+91 94150 23456', '@ananya.kavita', 'ananya.sharma@sangam.test', 'instagram'),
    ('c0000000-0000-0000-0000-000000000003', '+91 98450 34567', '@chetan_vachana', 'chetan.kumar@sangam.test', 'whatsapp'),
    ('c0000000-0000-0000-0000-000000000004', '+91 98300 45678', '@tanya_verses', 'tanya.m@sangam.test', 'email'),
    ('c0000000-0000-0000-0000-000000000005', '+91 94500 56789', '@kabir.doha', 'kabir.varma@sangam.test', 'whatsapp'),
    ('c0000000-0000-0000-0000-000000000006', '+91 98860 67890', '@lavanya_sitar', 'lavanya.rao@sangam.test', 'whatsapp'),
    ('c0000000-0000-0000-0000-000000000007', '+91 98220 78901', '@nikhil_acoustic', 'nikhil.d@sangam.test', 'instagram'),
    ('c0000000-0000-0000-0000-000000000008', '+91 98470 89012', '@meera.strings', 'meera.c@sangam.test', 'email'),
    ('c0000000-0000-0000-0000-000000000009', '+91 94480 90123', '@vignesh_folk', 'vignesh.h@sangam.test', 'whatsapp'),
    ('c0000000-0000-0000-0000-000000000010', '+91 98260 01234', '@riya_thumri', 'riya.saxena@sangam.test', 'instagram')
ON CONFLICT (user_id) DO NOTHING;

-- 3. SEED 20 MULTILINGUAL POSTS (Poetry & Music across Hindi, Kannada, English)
INSERT INTO public.posts (id, author_id, category, language, title, body_text, media_url, media_type, external_link, created_at)
VALUES
    -- Post 1 (Shishya Demo - Hindi Poetry)
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'poetry', 'Hindi',
     'धूप के साये और सूखी नदी',
     E'धूप के साये में बैठा सोचता हूँ आज भी,\nबहती थी जिस मोड़ पर वो इक नदी आवाज़ की।\n\nकागज़ों के शहर में अब लफ़्ज़ प्यासे मर रहे,\nढूँढती है रूह कोई छाँव फिर परवाज़ की।\n\nउंगलियाँ जब छू गईं इस साज़ के हर तार को,\nगूँज उठी हर अनकही दास्तान उस राज़ की।',
     null, 'none', null, now() - INTERVAL '14 days'),

    -- Post 2 (Shishya Demo - Hindi Music)
    ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'music', 'Hindi',
     'राग भैरवी: भोर की पहली पुकार (Acoustic Guitar)',
     E'शास्त्रीय राग भैरवी के स्वरों को छह तारों पर पिरोने का एक विनम्र प्रयास। भोर के सन्नाटे में जब मन शांत होता है, तब यह धुन जन्म लेती है।',
     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'audio',
     'https://www.youtube.com/watch?v=dQw4w9WgXcQ', now() - INTERVAL '12 days'),

    -- Post 3 (Ananya Sharma - Hindi Poetry)
    ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'poetry', 'Hindi',
     'मिट्टी की सौंधी खुशबू',
     E'पहली बूँद जब गिरी धरा पर, तृप्त हुआ हर प्राण,\nहवा में घुलकर फैल गया इक सदियों पुराना गान।\n\nन खेत बचे न वो पीपल छांव, कंक्रीट का यह जंगल,\nफिर भी मिट्टी याद दिलाती अपना भूला धाम।',
     null, 'none', null, now() - INTERVAL '11 days'),

    -- Post 4 (Chetan Kumar - Kannada Poetry)
    ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000003', 'poetry', 'Kannada',
     'ಬೆಳದಿಂಗಳ ಮೌನದಲ್ಲಿ (In the Moonlight)',
     E'ಬೆಟ್ಟದ ತುದಿಯಲಿ ಕುಳಿತು ನೋಡಲು,\nಹೊಳೆಯುತಿಹುದು ಬೆಳದಿಂಗಳ ಪ್ರವಾಹ.\nಮಾತು ಮರೆತು ಮೌನವಾದ ಮನಸ್ಸು,\nಹಾಡುತಿಹುದು ಪ್ರಕೃತಿಯ ಶಾಶ್ವತ ರಾಗ.\n\nಎಲ್ಲಿಂದ ಬಂತು ಈ ಶಾಂತಿ, ಎಲ್ಲಿಗೆ ಸಾಗಿದೆ ಜೀವ?\nಉತ್ತರವಿಲ್ಲದ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರವಾಗಿದೆ ಈ ಸಂಜೆ.',
     null, 'none', null, now() - INTERVAL '10 days'),

    -- Post 5 (Chetan Kumar - Kannada Music)
    ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'music', 'Kannada',
     'ಉತ್ತರ ಕರ್ನಾಟಕ ಜನಪದ ಲಾವಣಿ (Folk Ballad)',
     E'ಜನಪದ ತತ್ವಪದದ ಗಾಯನ. ದೇಸಿ ಶೈಲಿಯ ತಂಬೂರಿಯೊಂದಿಗೆ ಹಾಡಿದ ಕಾವ್ಯ.',
     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'audio',
     null, now() - INTERVAL '9 days'),

    -- Post 6 (Tanya Mukherjee - English Poetry)
    ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000004', 'poetry', 'English',
     'The Copper Loom of Dawn',
     E'Between the twilight and the waking street,\nThe copper mist unfurls its silent thread.\nOld memories like migrant swallows meet,\nUpon the eaves where forgotten vows were read.\n\nI stitch my restless rhythm to the light,\nAnd leave the ink to breathe into the morning calm.',
     null, 'none', null, now() - INTERVAL '9 days'),

    -- Post 7 (Tanya Mukherjee - English Music Video)
    ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'music', 'English',
     'Monsoon Solitude (Fingerstyle Acoustic Live Video)',
     E'Original instrumental recorded in one take during a heavy Kolkata rainstorm. Tuning: DADGAD.',
     'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', 'video',
     'https://www.youtube.com/watch?v=dQw4w9WgXcQ', now() - INTERVAL '8 days'),

    -- Post 8 (Kabir Varma - Hindi Poetry)
    ('d0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000005', 'poetry', 'Hindi',
     'गंगा किनारे शाम के दीप',
     E'दिए जो तैरते हैं रात की लहरों पे चुपके से,\nवो शायद कुछ अधूरी प्रार्थनाओं के मुसाफ़िर हैं।\n\nघाट की सीढ़ियाँ सदियों का दर्द थामे हैं,\nऔर पानी में पिघलती जा रही है रोशनी।',
     null, 'none', null, now() - INTERVAL '8 days'),

    -- Post 9 (Lavanya Rao - Kannada Poetry)
    ('d0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000006', 'poetry', 'Kannada',
     'ಹೃದಯದ ನಾದ ತರಂಗ (Whispers of the Soul)',
     E'ವೀಣೆಯ ತಂತಿಯ ಮಿಡಿತದಲಿ ಮೂಡಿದ ಕವನ.\nಕಂಡೂ ಕಾಣದ ಕನಸುಗಳ ಝೇಂಕಾರ,\nಕಣ್ಣಂಚಿನಲಿ ಹರಿದ ಹನಿಯೊಂದು ಕಾವ್ಯವಾಯಿತು ಇಂದು.',
     null, 'none', null, now() - INTERVAL '7 days'),

    -- Post 10 (Lavanya Rao - Kannada Music)
    ('d0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000006', 'music', 'Kannada',
     'ರಾಗ ಕಲ್ಯಾಣಿ: ಸಂಜೆ ಧ್ಯಾನ (Sitar Alap)',
     E'ಸಂಜೆಯ ರಾಗ ಕಲ್ಯಾಣಿಯಲ್ಲಿ ಸಿತಾರ್ ಅಲಾಪನೆ. ಗುರು ಮುಖೇನ ಕಲಿಯುವ ಹಂಬಲದೊಂದಿಗೆ ಅರ್ಪಣೆ.',
     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'audio',
     null, now() - INTERVAL '7 days'),

    -- Post 11 (Nikhil D’Souza - English Music)
    ('d0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000007', 'music', 'English',
     'Tides of Mandovi (Folk Ballad)',
     E'Written on the banks of Mandovi River watching fishing boats return under a purple sky.',
     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', 'audio',
     null, now() - INTERVAL '6 days'),

    -- Post 12 (Meera Chandran - English Poetry)
    ('d0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000008', 'poetry', 'English',
     'Sonnet of the Backwaters',
     E'The lotus blooms beneath the sleepy sun,\nWhere water lilies trace the quiet oars;\nAnother working day of life begun,\nUpon these emerald and forgotten shores.\n\nTime pauses here, a slow and patient breath,\nOutliving hurried vanity and death.',
     null, 'none', null, now() - INTERVAL '5 days'),

    -- Post 13 (Vignesh Hegde - Kannada Poetry)
    ('d0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000009', 'poetry', 'Kannada',
     'ಮಲೆನಾಡಿನ ಮಳೆ (Malnad Rain)',
     E'ಹಸಿರು ಎಲೆಗಳ ಮೇಲೆ ತಮಟೆಯ ನಾದ,\nಮಲೆನಾಡ ಕಾಡಿನಲಿ ಮಳೆಯ ಸಂವಾದ.\nನೆಲದ ಕಂಪು, ಹಳ್ಳದ ಸದ್ದು,\nಕವಿಯ ಎದೆಗೆ ಅಮೃತದ ಮದ್ದು.',
     null, 'none', null, now() - INTERVAL '5 days'),

    -- Post 14 (Riya Saxena - Hindi Music)
    ('d0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000010', 'music', 'Hindi',
     'याद पिया की (Acoustic Thumri Adaptation)',
     E'ठुमरी अंग के भावों को अकोस्टिक गिटार के साथ गाने की एक छोटी सी कोशिश।',
     'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg', 'audio',
     null, now() - INTERVAL '4 days'),

    -- Post 15 (Pandit Devavrata Shastri - Guru Post - Hindi Poetry)
    ('d0000000-0000-0000-0000-000000000015', 'b0000000-0000-0000-0000-000000000001', 'poetry', 'Hindi',
     'साधना के सूत्र: युवा कवियों के नाम',
     E'छंद केवल शब्दों की गिनती नहीं, श्वास की गति है। जो युवा कवि अपने अंतर्मन की गति को पहचान लेता है, उसकी हर पंक्ति एक मंत्र बन जाती है। कलम को कभी जल्दबाजी में न उठाएं; पहले मौन को पकना सीखें।',
     null, 'none', null, now() - INTERVAL '4 days'),

    -- Post 16 (Vidushi Malavika Sundaram - Guru Post - Kannada Music)
    ('d0000000-0000-0000-0000-000000000016', 'b0000000-0000-0000-0000-000000000002', 'music', 'Kannada',
     'ಕಲ್ಯಾಣ ವಸಂತ: ರಾಗ ಸಾಧನೆ',
     E'ಸಂಗೀತದ ನಾದೋಪಾಸನೆಯಲ್ಲಿ ಶುದ್ಧ ಸ್ವರಗಳ ಮಹತ್ವ. ಯುವ ಶಿಷ್ಯರಿಗೆ ರಿಯಾಝ್ ಕುರಿತ ಮಾರ್ಗದರ್ಶನ.',
     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', 'audio',
     null, now() - INTERVAL '3 days'),

    -- Post 17 (Ustad Zeeshan Farooqui - Guru Post - Hindi Poetry)
    ('d0000000-0000-0000-0000-000000000017', 'b0000000-0000-0000-0000-000000000003', 'poetry', 'Hindi',
     'बहर और रदीफ़ का संतुलन',
     E'ग़ज़ल कहना तलवार की धार पर चलना है। जब तक लफ़्ज़ों में दर्द और वज़न दोनों न हों, शेर मुकम्मल नहीं होता। संगम के युवा शायरों के लिए चंद हिदायतें।',
     null, 'none', null, now() - INTERVAL '3 days'),

    -- Post 18 (Acharya Someshwar Bhat - Guru Post - Kannada Poetry)
    ('d0000000-0000-0000-0000-000000000018', 'b0000000-0000-0000-0000-000000000004', 'poetry', 'Kannada',
     'ವಚನ ಸಾಹಿತ್ಯದ ಆಳ ಮತ್ತು ಸರಳತೆ',
     E'ಬಸವಣ್ಣ, ಅಲ್ಲಮಪ್ರಭುಗಳ ವಚನಗಳಲ್ಲಿನ ಅನುಭಾವದ ಕಿಡಿ ಇಂದಿನ ಯುವ ಕವಿಗಳಿಗೂ ದಾರಿದೀಪ.',
     null, 'none', null, now() - INTERVAL '2 days'),

    -- Post 19 (Dr. Evelyn Roy - Guru Post - English Poetry)
    ('d0000000-0000-0000-0000-000000000019', 'b0000000-0000-0000-0000-000000000005', 'poetry', 'English',
     'In Search of the Unbroken Lyric',
     E'Do not write to impress the marketplace. Write until your breath aligns with the rhythm of the hills. True poetry is an act of listening before it is an act of speech.',
     null, 'none', null, now() - INTERVAL '1 day'),

    -- Post 20 (Tarun Sengupta - Pending Guru Post - Hindi Music)
    ('d0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000006', 'music', 'Hindi',
     'बनारस की गलियों में गिटार (Sample Composition)',
     E'गंगा के अर्धचंद्राकार घाटों की पृष्ठभूमि में ध्वनियों का सम्मिश्रण।',
     'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 'audio',
     null, now() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 4. SEED LIKES
INSERT INTO public.likes (post_id, user_id, created_at)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', now() - INTERVAL '13 days'),
    ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', now() - INTERVAL '13 days'),
    ('d0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', now() - INTERVAL '12 days'),
    ('d0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', now() - INTERVAL '11 days'),
    ('d0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002', now() - INTERVAL '9 days'),
    ('d0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', now() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- 5. SEED COMMENTS
INSERT INTO public.comments (id, post_id, user_id, body, created_at)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001',
     'आयुष्मान भव! आपकी पंक्तियों में “धूप के साये” की उपमा हृदय को छूती है। छंद के संतुलन पर थोड़ी चर्चा हो तो यह रचना और भी प्रखर होगी।', now() - INTERVAL '13 days'),
    ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002',
     'अत्यंत सुंदर रचना आरव भाई। दूसरा शेर विशेष रूप से बहुत गहरा है।', now() - INTERVAL '12 days'),
    ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000002',
     'ಚೇತನ್, ನಿಮ್ಮ ವಚನ ಶೈಲಿಯ ಕವನದಲ್ಲಿ ಸಹಜವಾದ ಭಾವವಿದೆ. ಪದಗಳ ಆಯ್ಕೆ ಮಾಗಿದ ಕವಿಯಂತಿದೆ.', now() - INTERVAL '9 days')
ON CONFLICT (id) DO NOTHING;

-- 6. SEED CONNECTIONS (Mentorship Flows in multiple states)
-- State 1: ACCEPTED connection between Guru Demo (Devavrata) and Shishya Demo (Aarav Neelkanth)
-- -> This enables contact reveal testing right out of the box!
INSERT INTO public.connections (id, guru_id, shishya_id, post_id, note, status, created_at)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001',
     'd0000000-0000-0000-0000-000000000001',
     'आरव, मैंने आपकी “धूप के साये” कविता पढ़ी। आपकी आवाज़ में शास्त्रीय गहराई की संभावना है। मैं आपको छंद और शास्त्रीय गायकी के संगम का मार्गदर्शन देना चाहता हूँ।',
     'accepted', now() - INTERVAL '10 days'),

    -- State 2: PENDING connection from Vidushi Malavika to Chetan Kumar
    ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003',
     'd0000000-0000-0000-0000-000000000004',
     'ಚೇತನ್ ಅವರೇ, ನಿಮ್ಮ ವಚನ ಗಾಯನವನ್ನು ಕೇಳಿದೆ. ಭಾವಗೀತೆಗಳಲ್ಲಿ ರಾಗ ಸಂಯೋಜನೆ ಮಾಡಲು ನಾನು ನಿಮಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಬಯಸುತ್ತೇನೆ.',
     'pending', now() - INTERVAL '5 days'),

    -- State 3: PENDING connection to Shishya Demo (from Ustad Zeeshan Farooqui) so Shishya can test Accept / Reject live!
    ('f0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001',
     'd0000000-0000-0000-0000-000000000002',
     'Aarav, your acoustic guitar arrangement of Raag Bhairavi has soulful touch. I would like to mentor your phrasing.',
     'pending', now() - INTERVAL '1 day'),

    -- State 4: REJECTED connection example
    ('f0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000004',
     'd0000000-0000-0000-0000-000000000006',
     'I enjoyed your poem Tanya, wishing you all the best.',
     'rejected', now() - INTERVAL '7 days')
ON CONFLICT (id) DO NOTHING;

-- 7. SEED NOTIFICATIONS
INSERT INTO public.notifications (id, user_id, actor_id, type, post_id, connection_id, is_read, created_at)
VALUES
    ('a1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'like', 'd0000000-0000-0000-0000-000000000001', null, true, now() - INTERVAL '13 days'),
    ('a1000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'comment', 'd0000000-0000-0000-0000-000000000001', null, true, now() - INTERVAL '13 days'),
    ('a1000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'connect_request', null, 'f0000000-0000-0000-0000-000000000001', true, now() - INTERVAL '10 days'),
    ('a1000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'connect_accepted', null, 'f0000000-0000-0000-0000-000000000001', true, now() - INTERVAL '9 days'),
    ('a1000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'connect_request', null, 'f0000000-0000-0000-0000-000000000003', false, now() - INTERVAL '1 day'),
    ('a1000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'guru_approved', null, null, true, now() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- 8. SEED MOCK PAYMENTS
INSERT INTO public.payments (id, user_id, amount, plan, status, mock, created_at)
VALUES
    ('b1000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 60.00, 'shishya_onetime', 'paid', true, now() - INTERVAL '15 days'),
    ('b1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 200.00, 'guru_monthly', 'paid', true, now() - INTERVAL '60 days'),
    ('b1000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000006', 200.00, 'guru_monthly', 'paid', true, now() - INTERVAL '2 days')
ON CONFLICT (id) DO NOTHING;

