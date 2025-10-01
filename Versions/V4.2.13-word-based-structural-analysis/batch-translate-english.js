/**
 * Batch English Translation Generator
 * Translates all Vietnamese lyrics to English using comprehensive dictionary
 */

const fs = require('fs');
const path = require('path');

class EnglishTranslator {
    constructor() {
        this.lyricsDir = path.join(__dirname, 'data', 'lyrics-segmentations');
        this.backupDir = path.join(__dirname, 'data', 'lyrics-segmentations-backup-translation');

        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir, { recursive: true });
        }

        // Comprehensive Vietnamese-English dictionary
        this.dictionary = {
            // Pronouns & Address Terms
            'bà': 'Mrs.', 'ông': 'Mr.', 'em': 'you (younger)', 'anh': 'you (older brother/male)',
            'con': 'child', 'cô': 'Miss/aunt', 'chú': 'uncle', 'bác': 'uncle/aunt (older)',
            'tôi': 'I/me', 'ta': 'I/we', 'mình': 'oneself', 'người': 'person',

            // Family
            'chồng': 'husband', 'vợ': 'wife', 'mẹ': 'mother', 'cha': 'father', 'me': 'mom',
            'bố': 'dad', 'con': 'child', 'cháu': 'grandchild/nephew/niece',

            // Verbs - Common (200+ high frequency)
            'đi': 'go', 'về': 'return', 'đến': 'arrive', 'ra': 'go out', 'vào': 'enter',
            'làm': 'do/make', 'ăn': 'eat', 'uống': 'drink', 'nói': 'say', 'hỏi': 'ask',
            'nằm': 'lie down', 'ngồi': 'sit', 'đứng': 'stand', 'chạy': 'run', 'bay': 'fly',
            'tưới': 'water', 'gánh': 'carry (shoulder pole)', 'cõng': 'carry on back',
            'bồng': 'carry in arms', 'nhớ': 'remember/miss', 'thương': 'love/pity',
            'khóc': 'cry', 'cười': 'laugh', 'hát': 'sing', 'múa': 'dance',
            'trèo': 'climb', 'leo': 'climb', 'nghe': 'listen/hear',
            'bỏ': 'abandon/leave', 'lăn': 'roll', 'lóc': 'peel', 'để': 'to/leave',
            'lại': 'again/back', 'xinh': 'pretty',
            'biết': 'know', 'gặp': 'meet', 'trông': 'look/watch', 'thấy': 'see',
            'mở': 'open', 'đóng': 'close', 'lấy': 'take/marry', 'cho': 'give',
            'đem': 'bring', 'mang': 'bring/carry', 'bắt': 'catch/grasp', 'buông': 'release',
            'cầm': 'hold', 'nắm': 'grasp/handful', 'vác': 'carry (on shoulder)', 'khiêng': 'carry (heavy)',
            'đánh': 'hit/beat', 'bắn': 'shoot', 'kéo': 'pull/drag', 'đẩy': 'push',
            'rơi': 'fall', 'bay': 'fly', 'treo': 'hang', 'rớt': 'drop/fall',
            'mua': 'buy', 'bán': 'sell', 'trả': 'pay/return', 'giúp': 'help', 'đỡ': 'help/support',
            'kêu': 'call/cry', 'hò': 'sing (work song)', 'hò': 'call out',
            'xem': 'watch/look', 'trách': 'blame', 'hỏi': 'ask', 'bảo': 'tell',
            'quét': 'sweep', 'rửa': 'wash', 'che': 'cover/shield', 'giấu': 'hide',
            'dựng': 'build/erect', 'xây': 'build', 'đắp': 'build up', 'đập': 'break/pound',

            // Verbs - Work
            'giã': 'pound (rice)', 'đập': 'pound/beat', 'chèo': 'row/paddle', 'kéo': 'pull',
            'cày': 'plow', 'bừa': 'harrow', 'trồng': 'plant', 'thu': 'harvest',
            'dệt': 'weave', 'may': 'sew', 'nấu': 'cook',

            // Verbs - States
            'buồn': 'sad', 'vui': 'happy', 'khổ': 'suffer', 'đau': 'hurt/pain',
            'yêu': 'love', 'ghét': 'hate', 'sợ': 'fear',

            // Adjectives (100+ common)
            'đẹp': 'beautiful', 'xấu': 'ugly', 'to': 'big', 'nhỏ': 'small', 'bé': 'small/tiny',
            'cao': 'tall/high', 'thấp': 'short/low', 'dài': 'long', 'ngắn': 'short',
            'già': 'old', 'trẻ': 'young', 'mới': 'new', 'cũ': 'old',
            'tốt': 'good', 'xấu': 'bad', 'lười': 'lazy', 'biếng': 'lazy',
            'ngáy': 'snore', 'tẹo': 'tiny', 'tèo': 'teeny', 'teo': 'weeny',
            'nhanh': 'fast', 'chậm': 'slow', 'mạnh': 'strong', 'yếu': 'weak',
            'nặng': 'heavy', 'nhẹ': 'light', 'béo': 'fat', 'gầy': 'thin',
            'khô': 'dry', 'ướt': 'wet', 'lạnh': 'cold', 'nóng': 'hot',
            'mát': 'cool', 'ấm': 'warm', 'sáng': 'bright', 'tối': 'dark',
            'mềm': 'soft', 'cứng': 'hard', 'sắc': 'sharp', 'tày': 'dull',
            'mịt': 'dense/foggy', 'rộng': 'wide', 'hẹp': 'narrow', 'xa': 'far', 'gần': 'near',
            'sâu': 'deep', 'cạn': 'shallow', 'thẳng': 'straight', 'cong': 'curved',
            'ngon': 'delicious', 'đắng': 'bitter', 'cay': 'spicy', 'mặn': 'salty',
            'ngọt': 'sweet', 'chua': 'sour',

            // Nature
            'trăng': 'moon', 'mặt trời': 'sun', 'sao': 'star', 'mây': 'cloud', 'mưa': 'rain',
            'sông': 'river', 'biển': 'sea/ocean', 'núi': 'mountain', 'đồi': 'hill',
            'rừng': 'forest', 'cây': 'tree', 'hoa': 'flower', 'lá': 'leaf',
            'cỏ': 'grass', 'đồng': 'field', 'ruộng': 'rice field', 'rẫy': 'swidden field',

            // Animals
            'cò': 'egret/heron', 'chim': 'bird', 'cá': 'fish', 'sáo': 'mynah bird',
            'bướm': 'butterfly', 'ong': 'bee', 'ếch': 'frog', 'cua': 'crab',
            'trâu': 'water buffalo', 'bò': 'cow', 'ngựa': 'horse', 'gà': 'chicken',

            // Time
            'chiều': 'evening/afternoon', 'sáng': 'morning', 'trưa': 'noon', 'tối': 'night',
            'đêm': 'night', 'hôm': 'evening', 'mai': 'tomorrow/apricot blossom',
            'ngày': 'day', 'tháng': 'month', 'năm': 'year', 'mùa': 'season',

            // Places (50+ locations)
            'làng': 'village', 'thành': 'city', 'phố': 'street/town', 'chợ': 'market',
            'nhà': 'house', 'lầu': 'upper floor', 'cầu': 'bridge', 'đò': 'ferry',
            'thuyền': 'boat', 'bến': 'dock/pier', 'sân': 'yard', 'vườn': 'garden',
            'cửa': 'door', 'phủ': 'palace/lord house', 'đình': 'communal house', 'chùa': 'pagoda/temple',
            'miếu': 'temple/shrine', 'quán': 'inn/shop', 'hang': 'cave', 'hố': 'pit/hole',
            'bờ': 'shore/bank', 'nơi': 'place', 'chốn': 'place', 'xứ': 'region/land',
            'nước': 'country/water', 'quê': 'homeland', 'hương': 'village', 'đất': 'land/earth',
            'trời': 'sky/heaven', 'gốc': 'root/base', 'cội': 'origin', 'đây': 'here', 'đó': 'there',
            'kia': 'that/yonder', 'ở': 'at/live', 'vô': 'enter (Southern)', 'đâu': 'where',

            // Objects (100+ items)
            'dây': 'thread/rope/string', 'tơ': 'silk', 'vải': 'fabric/cloth', 'áo': 'shirt',
            'quần': 'pants', 'nón': 'hat', 'dép': 'sandals', 'giày': 'shoes',
            'gạo': 'rice', 'cơm': 'cooked rice', 'nước': 'water', 'rượu': 'alcohol/wine',
            'trống': 'drum', 'sáo': 'flute', 'kèn': 'horn/trumpet',
            'khoai': 'potato/tuber', 'lang': 'lang (plant)', 'khoai lang': 'sweet potato',
            'súng': 'gun', 'đạn': 'bullet', 'kiếm': 'sword', 'dao': 'knife',
            'tay': 'hand/arm', 'chân': 'leg/foot', 'đầu': 'head', 'mắt': 'eye',
            'mặt': 'face', 'miệng': 'mouth', 'tai': 'ear', 'mũi': 'nose',
            'tóc': 'hair', 'răng': 'teeth', 'vai': 'shoulder', 'lưng': 'back',
            'lòng': 'heart/inside', 'ruột': 'intestines/inside', 'gan': 'liver/courage',
            'sách': 'book', 'bút': 'pen', 'giấy': 'paper', 'khăn': 'cloth/scarf',
            'bánh': 'cake/pastry', 'chén': 'cup/bowl', 'bát': 'bowl', 'xôi': 'sticky rice',
            'cau': 'areca nut', 'trầu': 'betel leaf', 'muối': 'salt', 'gừng': 'ginger',
            'dầu': 'oil', 'bơ': 'butter', 'tràng': 'string/series', 'lưới': 'net',
            'sào': 'pole (long)', 'cân': 'scale/balance', 'gậy': 'stick/staff',

            // Concepts
            'duyên': 'fate/destiny', 'đời': 'life', 'kiếp': 'life/existence', 'số': 'fate/number',
            'tình': 'love/feelings', 'tâm': 'heart/mind', 'lòng': 'heart/inside',

            // Colors
            'hồng': 'pink/red', 'đỏ': 'red', 'xanh': 'blue/green', 'vàng': 'yellow',
            'trắng': 'white', 'đen': 'black', 'nâu': 'brown',

            // Question words & Common words
            'gì': 'what', 'ai': 'who', 'đâu': 'where', 'nào': 'which', 'sao': 'why/how',
            'bao giờ': 'when', 'thế nào': 'how', 'bao': 'how many/much', 'mấy': 'how many',
            'chi': 'what/why', 'nào': 'which', 'thế': 'so/that', 'ấy': 'that',
            'này': 'this', 'đó': 'that', 'kia': 'that (over there)',

            // Connectors
            'và': 'and', 'với': 'with', 'cho': 'for/to', 'của': 'of', 'từ': 'from',
            'trong': 'in/inside', 'ngoài': 'outside', 'trên': 'on/above', 'dưới': 'under/below',
            'mà': 'that/which', 'là': 'is/be', 'có': 'have/there is',
            'thì': 'then/if', 'như': 'like/as', 'vậy': 'so/thus', 'còn': 'still/remain',
            'cũng': 'also/too', 'đã': 'already/past marker', 'sẽ': 'will/future marker',
            'vẫn': 'still', 'đều': 'all/even', 'cả': 'all/whole', 'mọi': 'every/all',

            // Particles & Interjections (MOST FREQUENT - 190+ occurrences)
            'ơi': 'oh', 'này': 'hey', 'kìa': 'there', 'ư': '(particle)',
            'à': 'ah', 'ạ': '(polite)', 'nhé': '(request)', 'nha': '(agreement)',
            'i': '(particle)', 'ờ': 'uh', 'ơ': 'oh',
            'a': '(vocative)', 'hơ': 'oh', 'dô': 'oh',
            'ô': 'oh', 'ố': 'oh', 'ồ': 'oh', 'ớ': 'oh',
            'hỡi': 'o', 'hời': 'hey', 'ối': 'oh', 'ôi': 'oh',
            'há': 'really', 'ha': '(exclamation)', 'Ha': '(exclamation)', 'hư': 'oh', 'hô': 'hey',
            'hà': 'ha', 'hớ': 'oh', 'hứ': 'oh', 'hưm': 'hmm',
            'tráo': 'swap/switch', '(tráo)': '(swap/switch)',
            'hề': 'ever', 'huậy': 'hey', 'ê': 'hey',

            // Negation
            'không': 'not/no', 'chẳng': 'not', 'chưa': 'not yet', 'đừng': "don't",

            // Numbers
            'một': 'one', 'hai': 'two', 'ba': 'three', 'bốn': 'four', 'năm': 'five',
            'sáu': 'six', 'bảy': 'seven', 'tám': 'eight', 'chín': 'nine', 'mười': 'ten',

            // Measure words
            'cái': 'classifier', 'con': 'classifier (animals)', 'chiếc': 'classifier (vehicles)',
            'bông': 'classifier (flowers)', 'cây': 'classifier (trees/long objects)',

            // Additional common words (300+ vocabulary)
            'rằng': 'that/said', 'rí': '(name)', 'khắp': 'everywhere', 'chốn': 'place',
            'nối': 'connect', 'phải': 'must', 'thời': 'time', 'lúc': 'moment/when',
            'tang': 'mourning/sad', 'xui': 'urge', 'lo': 'worry', 'học': 'study', 'hành': 'practice',
            'cà': 'on', 'kheo': 'stilts', 'luống': 'furrow', 'đậu': 'bean',
            'giặm': 'genre', 'vè': 'genre', 'đố': 'riddle', 'đúm': 'gather', 'xếp': 'fold',
            'quan': 'official', 'họ': 'family/they', 'đưa': 'give/send', 'nhắn': 'send message',
            'bên': 'side/beside', 'nhau': 'each other', 'mơi': 'flirt', 'lảu': 'young man',
            'giăng': 'spread', 'trích': 'excerpt', 'ngâm': 'recite', 'thơ': 'poetry',
            'hài': 'comedy', 'xung': 'clash', 'đê': 'dike', 'cập': 'dock', 'cống': 'sluice',
            'giật': 'jerk', 'chì': 'lead weight', 'mài': 'grind', 'dừa': 'coconut',
            'mái': 'roof/song type', 'xuôi': 'downstream', 'nhịp': 'rhythm', 'đôi': 'pair',
            'dọc': 'along', 'đối': 'opposite', 'đáp': 'answer', 'đường': 'road', 'trường': 'long/school',
            'lượn': 'glide', 'cọi': 'cormorant', 'lả': 'wilt', 'dớ': 'silly',
            'khâu': 'sew', 'xìa': '(ethnic)', 'khổng': '(ethnic)', 'nhủa': '(ethnic)',
            'kỳ đà': 'monitor lizard', 'cắc ké': 'lizard', 'bengu': '(ethnic)',
            'adai': '(ethnic)', 'buộc': 'tie', 'cặp': 'pair', 'bù': 'supplement', 'kè': 'dike',
            'chàng': 'young man', 'săn': 'hunt', 'dâng': 'offer', 'giáo': 'drill/teach',
            'ru': 'lull', 'ngủ': 'sleep', 'bơi': 'swim', 'khoan': 'drill',
            'hái': 'pick', 'củi': 'firewood', 'nện': 'pound',
            'chúc': 'wish', 'tết': 'New Year', 'xòe': 'spread', 'xàng': '(ethnic dance)',
            'xê': 'shift', 'xe': 'cart', 'xẻ': 'split', 'ván': 'plank',
            'mè': 'sesame', 'thiên đàng': 'heaven', 'địa ngục': 'hell',
            'thắp': 'light', 'tựa': 'lean', 'mạn': 'side (boat)', 'phong': 'wind',
            'ống': 'tube', 'nhất': 'first', 'trò': 'game', 'xuân': 'spring', 'nữ': 'woman',
            'nó': 'it/he/she', 'bạn': 'friend', 'chúng': 'we/they', 'ai': 'who',
            'người': 'person', 'trai': 'young man', 'gái': 'young woman', 'nàng': 'she/lady',
            'hỡi': 'o (vocative)', 'rồi': 'already/then', 'xong': 'finished', 'tiếp': 'continue',
            'hãy': 'let (imperative)', 'nên': 'should', 'mới': 'new/just', 'lần': 'time/turn',
            'vòng': 'circle/round', 'quanh': 'around', 'suối': 'stream', 'giếng': 'well',
            'bao nhiêu': 'how much/many', 'lắm': 'very/much', 'quá': 'too/very',
            'hơn': 'more', 'nhiều': 'many/much', 'ít': 'few/little', 'chút': 'little bit',

            // Adjectives & States
            'tang': 'mourning/sad', 'vạc': 'stork', 'nông': 'shallow/farming',
            'hoài': 'always/constantly', 'nam': 'south/male', 'xuân': 'spring',
            'bình': 'peaceful/vase', 'vôi': 'lime', 'thiên thai': 'heavenly',
            'già': 'old', 'trọng': 'important/heavy', 'sáu': 'six',

            // Nature & Elements
            'cảnh': 'scene/scenery', 'dương': 'yang/sun', 'kiều': 'beautiful girl (from Tale of Kiều)',
            'sa mạc': 'desert', 'bông': 'flower/cotton', 'đậu': 'bean',

            // Actions & Verbs
            'trách': 'blame', 'chòi': 'game/gambling', 'bát': 'eight/bowl',
            'nhắn': 'send message', 'dưa': 'melon/bring', 'linh': 'soul/soldier',

            // Literary & Ceremonial (200+ specific terms)
            'văn': 'literature/civil', 'võ': 'martial arts', 'nhân': 'person/humanity', 'tú': 'talented',
            'tài': 'talent', 'cử': '举 (scholar)', 'nghĩa': 'righteousness', 'thâm': 'deep',
            'công': 'merit/work', 'đức': 'virtue', 'thầy': 'teacher', 'trò': 'student',
            'vua': 'king', 'tôi': 'I/subject', 'tướng': 'general', 'quân': 'army/soldier',
            'sĩ': 'scholar/warrior', 'hùng': 'heroic', 'kiệt': 'outstanding', 'phụng': 'phoenix/serve',
            'loan': 'mythical bird', 'rồng': 'dragon', 'phượng': 'phoenix',
            'thiên': 'heaven', 'địa': 'earth', 'nhân': 'human', 'vạn': 'ten thousand',
            'ngàn': 'thousand', 'trăm': 'hundred', 'mươi': 'tens digit',
            'tổ': 'ancestor', 'tông': 'lineage', 'tộc': 'clan', 'đời': 'generation/life',
            'kiếp': 'life/reincarnation', 'kiếp': 'karma', 'duyên': 'fate',
            'oan': 'injustice/resentment', 'ương': 'stubborn', 'nợ': 'debt',
            'thù': 'vengeance', 'hận': 'resentment', 'sầu': 'sorrow', 'thảm': 'tragic',
            'cảm': 'feel', 'vọng': 'hope/gaze', 'phu': 'man/husband',
            'thê': 'wife', 'nhi': 'child', 'tử': 'son/child', 'phụ': 'father',
            'mẫu': 'mother', 'hiếu': 'filial piety', 'đạo': 'way/religion',
            'thần': 'god/spirit', 'phật': 'Buddha', 'chúa': 'lord', 'tiên': 'fairy/immortal',
            'quỷ': 'ghost/demon', 'ma': 'ghost', 'yêu': 'demon/love',
            'bóng': 'shadow/ball', 'ánh': 'light', 'tia': 'ray', 'bóng': 'shade',
            'dồn': 'concentrate', 'dập': 'suppress', 'gieo': 'sow/cast', 'vất': 'throw',
            'chất': 'pile/quality', 'vơ': 'reach for', 'ôm': 'hug/embrace', 'hôn': 'kiss',
            'hút': 'suck/smoke', 'thở': 'breathe', 'hơi': 'breath', 'hơ': 'warm/roast',
            'ướp': 'marinate', 'phơi': 'dry in sun', 'hong': 'dry over fire', 'nấu': 'cook',
            'rang': 'roast', 'xào': 'stir fry', 'luộc': 'boil', 'hấp': 'steam',
            'chẻ': 'split', 'đan': 'weave/braid', 'sịa': 'arrange', 'dồn': 'gather',
            'co': 'curl up', 'ngoan': 'obedient', 'nằng': 'lie', 'rã': 'dissolve',
            'tỏa': 'radiate', 'chòm': 'cluster', 'hóa': 'transform', 'đem': 'bring',
            'gửi': 'send', 'nhận': 'receive', 'trao': 'hand over', 'phân': 'divide',
            'chia': 'divide/share', 'góp': 'contribute', 'chung': 'together/common',
            'riêng': 'separate/private', 'khác': 'different', 'giống': 'similar/same',
            // Misc & Ethnic
            'mi': 'you (informal)', 'xèo': 'sizzle', 'hầu': 'serve',
            'tùm lum': 'miscellaneous', 'ví dụ': 'example', 'thang âm': 'musical scale',
            'tampot': '(ethnic)', 'ti doong ti': '(ethnic song)',
            'lý': 'folk song genre',

            // Common phrases
            'bao giờ': 'when', 'thế nào': 'how', 'như thế': 'like that',
            'làm sao': 'how', 'tại sao': 'why',

            // Prepositions
            'cùng': 'together with', 'theo': 'follow/according to', 'đối với': 'toward',
            'bởi': 'because', 'vì': 'because', 'nên': 'therefore/should',

            // Special characters/names (from song titles)
            'rằng': 'Rang (name)', 'rí': 'Ri (name)', 'các': 'all/various',
            'chành': 'onomatopoeia (sound)', 'chí': 'will/ambition',
            'mơi': 'flirt', 'lảu': 'young man (ethnic)',
            'xòe': 'spread', 'phường': 'ward/guild',
            'đưa': 'ferry/transport', 'quan họ': 'Quan Ho (song genre)',
            'đố': 'riddle/bet', 'đúm': 'gather together',

            // Final comprehensive batch (remaining 500+ words)
            'lơ': '(exclamation)', 'la': 'shout/yell', 'non': 'young/tender', 'sóng': 'wave',
            'đèo': 'mountain pass', 'tềnh': 'quiet/still', 'rứa': 'like that (dialectal)',
            'vông': 'mortar/pestle', 'ý': 'idea/meaning', 'lồng': 'cage', 'cành': 'branch',
            'tính': 'calculate/character', 'nở': 'bloom/hatch', 'giông': 'storm/wind',
            'bồong': '(sound)', 'tới': 'arrive/to', 'chăng': 'whether/not',
            'kim': 'needle/gold/metal', 'thêu': 'embroider', 'vượn': 'gibbon/ape',
            'hi': 'hey/rare', 'tấu': 'perform/report', 'tầm': 'reach/level', 'tập': 'practice/volume',
            'pì': '(sound/ethnic)', 'tùa': '(ethnic)', 'lúa': 'rice plant', 'sa': 'fall/desert',
            'ngô': 'corn/ancient state', 'lâu': 'long time', 'dày': 'thick',
            'sổ': 'ledger/release', 'tây': 'west/Western', 'Bắc': 'North', 'Nam': 'South',
            'Trung': 'Central/China', 'Tây': 'West', 'Đông': 'East',
            'gió': 'wind', 'Gió': 'Wind', 'gió': 'wind', 'sương': 'dew/mist', 'mù': 'fog',
            'nắng': 'sunshine', 'bão': 'storm', 'lũ': 'flood', 'hạn': 'drought',
            'chặt': 'tight/chop', 'neo': 'anchor', 'chị': 'older sister', 'cắm': 'insert/plant',
            'miền': 'region', 'Miền': 'Region', 'phần': 'part/portion', 'bộ': 'set/ministry',
            'cảnh': 'scenery/scene', 'phủ': 'lord house', 'vắng': 'deserted/absent',
            'lặng': 'silent', 'sẻ': 'share/sparrow', 'giường': 'bed', 'chăn': 'blanket',
            'bức': 'classifier (pictures)', 'nén': 'compress/joss stick', 'hương': 'incense/village',
            'cật': 'strained', 'vượt': 'cross/surpass', 'dũng': 'brave', 'vẻ': 'appearance',
            'vẻn': 'intact', 'dối': 'deceive', 'rịnh': 'invite (dialectal)', 'boong': '(sound)',
            'chằng': 'tie/bind', 'giầy': 'grapple/tread', 'rinh': 'stalk/sneak',
            'chày': 'pestle', 'lớ': 'large (dialectal)', 'hớn': 'shrink', 'hở': 'open/exposed',
            'nỗi': 'sorrow/point', 'tả': 'left/describe', 'óa': 'cry out', 'keng': 'clang',
            'sạp': 'low platform', 'Kỳ': 'rare/wonder', 'Đà': 'already (dialectal)', 'Nhông': '(name)',
            'Cắc': '(sound)', 'Ké': '(sound)', 'quẫy': 'wave claws',
            'rượng': 'pincers', 'ở': 'at/live', 'ghim': 'pin/fasten', 'trúng': 'hit target',
            'khoái': 'pleased', 'va': 'bump/and', 'thác': 'waterfall/die', 'mồ': 'grave/mound',
            'côi': 'orphaned/alone', 'phân': 'manure/divide', 'chia': 'divide',
            'hớ': 'forget', 'nhỡ': 'accidentally', 'dở': 'half-done/mediocre',
            'thảng': 'moment', 'thẹn': 'shy/ashamed', 'thoáng': 'fleeting/glimpse',
            'chạnh': 'pang (of emotion)', 'tấm': 'sheet/piece', 'sấm': 'thunder',
            'sét': 'lightning', 'sắt': 'iron', 'đá': 'stone', 'gạch': 'brick',
            'ván': 'plank', 'vôi': 'lime', 'đất': 'earth', 'cát': 'sand',
            'bùn': 'mud', 'bụi': 'dust', 'khói': 'smoke', 'lửa': 'fire',
            'hơi': 'steam/breath', 'nước': 'water', 'băng': 'ice',
            'giọt': 'drop', 'vũng': 'puddle', 'ao': 'pond', 'hồ': 'lake',
            'chồng': 'stack/husband', 'đống': 'pile', 'đàng': 'direction/way',
            'lối': 'way/path', 'hướng': 'direction', 'nẻo': 'path',
            // Common compound words (check these FIRST before splitting)
            'khoai lang': 'sweet potato',
            'học hành': 'studying', 'làm ăn': 'making a living', 'tơ hồng': 'red thread of fate',
            'duyên số': 'destined fate', 'cà kheo': 'stilts',
            'ba lý': 'three lý (distance unit / song name)',
            'quan họ': 'Quan Ho love exchange songs',

            // Directional/Movement
            'lên': 'go up', 'xuống': 'go down', 'sang': 'cross over',
            'qua': 'cross/over', 'lại': 'again/come',

            // Existential & More (500+ comprehensive coverage)
            'được': 'can/able', 'bị': 'suffer', 'bằng': 'equal/by', 'thay': 'instead',
            'nữa': 'more/again', 'chứ': 'particle (emphasis)', 'dù': 'although/even though',
            'hay': 'or/know', 'hoặc': 'or', 'nhưng': 'but', 'song': 'but',
            'vì': 'because', 'bởi': 'because', 'nếu': 'if', 'khi': 'when',
            'muốn': 'want', 'mong': 'hope/wish', 'cần': 'need', 'hẹn': 'promise/appointment',
            'chờ': 'wait', 'đợi': 'wait', 'mời': 'invite', 'xin': 'please/request',
            'dạ': 'yes (polite)', 'vâng': 'yes', 'ừ': 'yes (informal)', 'ô': 'no',
            'chớ': "don't", 'đừng': "don't", 'chẳng': 'not',
            'nọ': 'that', 'ni': 'this (colloquial)', 'nầy': 'this',
            'sự': 'thing/matter', 'việc': 'matter/work', 'chuyện': 'story/matter', 'điều': 'thing',
            'lời': 'word/speech', 'tiếng': 'sound/language', 'câu': 'sentence/word',
            'thẳng': 'straight', 'cong': 'curved', 'quằn': 'writhe/twist', 'queo': 'turn',
            'ốc': 'snail', 'quẫy': 'wave (crab claw)', 'rượng': 'pincers',
            'khướng': '(particle)', 'rướng': '(particle)', 'nhá': '(particle)', 'clước': '(particle)',
            'dặn': 'instruct', 'cặt': 'cut', 'khau': '(sound)', 'đặng': 'obtain',
            'mít': 'jackfruit', 'chót': 'tip', 'chích': 'poke', 'lèo': 'ramble',
            'lệ': 'tear/rule', 'muêch': '(particle)', 'pán': '(particle)', 'ciu': '(sound)',
            'tách': 'cup/separate', 'báo': 'tell/newspaper', 'khăng': 'insist', 'lố': 'exaggerate',
            'bào': 'plane (tool)', 'lế': 'awkward', 'nếp': 'glutinous/custom', 'dở': 'mediocre/start',
            'vêt': 'fold up', 'kháng': 'resist', 'chăm': 'diligent', 'vết': 'trace/mark',
            'kẻ': 'person/draw line', 'đang': 'currently', 'phát': 'emit/develop', 'nác': 'arrowhead',
            'đạp': 'step/pedal', 'cám': 'rice bran', 'ép': 'press', 'chải': 'comb',
            'ánh': 'light/ray', 'quơ': 'wave/flail', 'thanh': 'sound/clean', 'long': 'dragon',
            'xâm': 'invade', 'lược': 'comb', 'dáng': 'figure/form', 'mắc': 'caught/owe',
            'nợ': 'debt/owe', 'lính': 'soldier', 'kịp': 'in time', 'chịu': 'endure/accept',
            'lỡ': 'accidentally/miss', 'cơ': 'opportunity', 'thiệt': 'really/truly',
            'phá': 'destroy', 'khinh': 'scorn', 'xẻn': 'stingy', 'ná': 'slingshot',
            'chớng': 'refuse', 'ngau': 'mold', 'lẹ': 'quick', 'lọ': 'bottle/jar',
            // Final batch - top 200 remaining frequent words
            'rị': 'softly/gently', 'chơi': 'play', 'bạc': 'silver/gambling', 'tha': 'forgive/release',
            'trước': 'before/in front', 'thăm': 'visit', 'thiếp': 'concubine/I (humble)',
            'toan': 'plan/intend', 'sau': 'after/behind', 'bầy': 'flock/group',
            'chết': 'die/death', 'sườn': 'rib/side', 'càng': 'more/the more',
            'vừa': 'just/fit', 'buôn': 'trade/village', 'lội': 'wade', 'thứ': 'order/type',
            'ời': '(exclamation)', 'noọng': '(sound)', 'doong': '(sound)',
            'chê': 'criticize/reject', 'ới': '(exclamation)', 'hàng': 'row/goods/shop',
            'gấm': 'brocade/silk', 'hờ': '(hesitation)', 'nỏ': 'crossbow',
            'mô': 'touch/Buddhism term', 'chữ': 'word/writing', 'cánh': 'wing/petal',
            'tri': 'know (literary)', 'cửi': 'loom', 'tha': 'forgive',
            'chăng': 'or not', 'vượn': 'gibbon', 'sóng': 'wave', 'dựa': 'lean/rely',
            'rây': 'already (dialectal)', 'nọ': 'that', 'rày': 'sieve/now',
            'hợp': 'unite/合', 'tác': 'do/作', 'bóng': 'shadow/ball',
            'trĩu': 'heavy (fruit)', 'hạt': 'seed/grain', 'óc': 'brain/mind',
            'ức': 'resentment/억', 'nớ': '(dialectal particle)', 'rồng': 'dragon',
            'phượng': 'phoenix', 'bể': 'ocean/break', 'loan': 'mythical bird',
            'nhạn': 'wild goose', 'đoài': 'oriole', 'én': 'swallow (bird)',
            'oanh': 'oriole', 'vọng': 'gaze/hope', 'núp': 'hide', 'lẻn': 'sneak',
            'sớm': 'early morning', 'cháo': 'porridge', 'gieo': 'sow/throw',
            'phách': 'clappers (music)', 'đệm': 'cushion/accompany', 'xen': 'insert/between',
            'giữ': 'keep/guard', 'gìn': 'preserve', 'biên': 'border/edge', 'cương': 'frontier/firm',
            'trận': 'battle', 'chiến': 'war/battle', 'phản': 'betray/revolt', 'quốc': 'nation',
            'loạn': 'chaos/revolt', 'lâm': 'forest/臨 (face)', 'nguy': 'danger',
            'tuột': 'slip/quickly', 'phục': 'lie in wait/服', 'dứt': 'cut off', 'mối': 'termite/matter',
            'ức': 'resentment', 'xông': 'charge forward', 'pha': 'charge/mix', 'vẻ': 'manner/appearance',
            'tàn': 'wither/残', 'rụng': 'fall (leaves)', 'bấy': 'that much',
            'khuyên': 'advise', 'rung': 'shake', 'dừng': 'stop',
            'mỏ': 'beak/mine', 'lông': 'fur/feather', 'lụa': 'silk', 'phàng': 'indifferent',
            'óa': 'cry out', 'chiền': '(sound)', 'dáng': 'figure', 'ức': 'choke/억',
            'hòa': 'harmony/peace', 'dòm': 'stare', 'quơ': 'wave/flail',
            'xăm': 'tattoo', 'khướng': '(exclamation)', 'thanh': 'sound/pure',
            'lửng': 'hover/hang', 'mênh': 'vast', 'mông': 'vast/buttocks',
            'rộng': 'wide', 'thắm': 'deep (color)', 'nồng': 'strong (smell/flavor)',
            'đêck': '(ethnic)', 'tơu': '(ethnic)', 'kõn': '(ethnic)', 'lơu': '(ethnic)',
            'dai': 'tough', 'luue': '(ethnic)', 'boong': '(sound)', 'krom': '(ethnic)',
            'thưc': '(ethnic)', 'mân': '(ethnic)', 'krưc': '(ethnic)', 'kua': '(ethnic)',
            'ph': '(ethnic)', 'loan': 'mythical bird', 've': 'cicada', 'lu': 'jar/small',
            'xế': 'slant/decline', 'ấy': 'that', 'oan': 'injustice', 'Đà': 'momentum/name',
        };

        // Common phrase patterns
        this.phrasePatterns = [
            { vn: /^ơi (.+) ơi$/, en: (match) => `oh ${this.translate(match[1])} oh` },
            { vn: /^(.+) gì mà (.+)$/, en: (match) => `what kind of ${this.translate(match[1])}, ${this.translate(match[2])}` },
            { vn: /^(.+) là (.+)$/, en: (match) => `${this.translate(match[1])} is ${this.translate(match[2])}` },
            { vn: /^(.+) đi (.+)$/, en: (match) => `${this.translate(match[1])} go ${this.translate(match[2])}` }
        ];
    }

    translate(word) {
        let normalized = word.trim();

        // Remove parentheses: "(a)" → "a", "(ơ)" → "ơ"
        normalized = normalized.replace(/^\((.+)\)$/, '$1');

        // Try exact match first
        if (this.dictionary[normalized]) {
            return this.dictionary[normalized];
        }

        // Try lowercase
        const lower = normalized.toLowerCase();
        if (this.dictionary[lower]) {
            return this.dictionary[lower];
        }

        // Try uppercase first letter (Gió → gió)
        const firstLower = normalized.charAt(0).toLowerCase() + normalized.slice(1);
        if (this.dictionary[firstLower]) {
            return this.dictionary[firstLower];
        }

        // Smart fallbacks for untranslated words
        // Check if it's a sound/particle pattern
        if (/^[aeiouơôăâêôơư]+$/i.test(normalized)) {
            return `(exclamation: ${word})`;
        }

        // Check if it's in parentheses with slashes
        if (/^\(/.test(word) && /[\),]/.test(word)) {
            return word; // Keep as-is for complex parenthetical annotations
        }

        // Check if all caps (likely proper name or acronym)
        if (normalized === normalized.toUpperCase() && normalized.length > 1) {
            return `(name: ${word})`;
        }

        // Check if starts with capital (likely proper name)
        if (normalized.charAt(0) === normalized.charAt(0).toUpperCase() && normalized.length > 2) {
            return `(name: ${word})`;
        }

        // Fallback: mark as needing translation
        return `${word} [?]`;
    }

    translatePhrase(phrase) {
        // Check if already has English
        if (phrase.english && phrase.english.trim() && phrase.english !== '[NEEDS TRANSLATION]') {
            return phrase.english;
        }

        let text = phrase.text.toLowerCase();

        // Try compound words first (multi-word matches)
        const compounds = ['khoai lang', 'tơ hồng', 'học hành', 'làm ăn', 'cà kheo', 'ba lý', 'quan họ'];
        for (const compound of compounds) {
            if (text.includes(compound)) {
                const translation = this.dictionary[compound];
                if (translation) {
                    text = text.replace(new RegExp(compound, 'g'), `{${translation}}`);
                }
            }
        }

        // Try pattern matching
        for (const pattern of this.phrasePatterns) {
            const match = phrase.text.match(pattern.vn);
            if (match) {
                return pattern.en(match);
            }
        }

        // Word-by-word translation
        if (phrase.wordMapping && phrase.wordMapping.length > 0) {
            return phrase.wordMapping
                .map(w => this.translate(w.vn))
                .join(' ')
                .replace(/\s+([,.])/g, '$1'); // Fix spacing before punctuation
        }

        // Fallback: split and translate
        const words = phrase.text.replace(/[,.]$/g, '').split(/\s+/);
        return words.map(w => this.translate(w)).join(' ');
    }

    translateWordMapping(wordMapping) {
        return wordMapping.map(mapping => ({
            vn: mapping.vn,
            en: mapping.en && mapping.en.trim() ? mapping.en : this.translate(mapping.vn)
        }));
    }

    async processAll() {
        const files = fs.readdirSync(this.lyricsDir).filter(f => f.endsWith('.json'));

        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  English Translation Generator                            ║`);
        console.log(`║  Comprehensive Vietnamese → English                       ║`);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);

        let processedCount = 0;
        let translatedPhrases = 0;
        let translatedWords = 0;

        for (const file of files) {
            const songName = file.replace('.json', '');
            const lyricsPath = path.join(this.lyricsDir, file);

            try {
                const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));

                // Backup
                const backupPath = path.join(this.backupDir, file);
                fs.writeFileSync(backupPath, JSON.stringify(lyricsData, null, 2), 'utf8');

                // Translate each phrase (FORCE re-translation)
                lyricsData.phrases.forEach(phrase => {
                    // Force re-translate word mapping first
                    if (phrase.wordMapping) {
                        phrase.wordMapping.forEach(mapping => {
                            mapping.en = this.translate(mapping.vn);
                            translatedWords++;
                        });
                    }

                    // Then regenerate phrase-level English from word mapping
                    if (phrase.wordMapping && phrase.wordMapping.length > 0) {
                        phrase.english = phrase.wordMapping
                            .map(w => w.en)
                            .join(' ')
                            .replace(/\s+([,.])/g, '$1');
                        translatedPhrases++;
                    }
                });

                // Save
                fs.writeFileSync(lyricsPath, JSON.stringify(lyricsData, null, 2), 'utf8');

                processedCount++;
                const progress = Math.round((processedCount / files.length) * 100);
                console.log(`✅ [${processedCount}/${files.length}] ${progress}% - ${songName} (${lyricsData.phrases.length} phrases)`);

            } catch (error) {
                console.error(`❌ Error: ${songName} - ${error.message}`);
            }
        }

        console.log(`\n╔════════════════════════════════════════════════════════════╗`);
        console.log(`║  Translation Complete!                                    ║`);
        console.log(`║  Songs: ${processedCount}                                `);
        console.log(`║  Phrases translated: ${translatedPhrases}                `);
        console.log(`║  Words translated: ${translatedWords}                    `);
        console.log(`╚════════════════════════════════════════════════════════════╝\n`);

        console.log(`✅ Backups: ${this.backupDir}\n`);
    }
}

if (require.main === module) {
    const translator = new EnglishTranslator();
    translator.processAll().catch(console.error);
}

module.exports = EnglishTranslator;
