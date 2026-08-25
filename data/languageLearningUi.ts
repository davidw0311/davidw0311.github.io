import type { LanguageId } from "./languageLearning";

export type LanguageLearningUiCopy = {
  brandSubtitle: string;
  backToSpace: string;
  navigationLabel: string;
  appLabel: string;
  lessons: string;
  story: string;
  counting: string;
  localProgress: string;
  xp: string;
  savedCount: string;
  changeSystemLanguage: string;
  systemLanguage: string;
  chooseLesson: string;
  chooseLessonHelp: string;
  learningLanguage: string;
  displayedLanguages: string;
  chooseDisplayedLanguages: string;
  noDisplayedLanguages: string;
  toneWarning: string;
  availableLessons: string;
  openLesson: string;
  minutes: string;
  completedCount: string;
  promptsCount: string;
  continue: string;
  start: string;
  practiceIn: string;
  promptProgress: string;
  sampleComplete: string;
  sampleCompleteBody: string;
  practiceAgain: string;
  chooseAnotherLesson: string;
  sayThisNumber: string;
  supportReader: string;
  supportHelp: string;
  remove: string;
  playSentence: string;
  reorderLanguage: string;
  addLanguage: string;
  allLanguagesAdded: string;
  showRomanization: string;
  phraseDetails: string;
  closePhraseDetails: string;
  phraseIn: string;
  characterDetails: string;
  closeCharacterDetails: string;
  characterIn: string;
  wordDetails: string;
  closeWordDetails: string;
  wordIn: string;
  backToPhrase: string;
  pronunciationGuide: string;
  pronunciationOff: string;
  englishPhonetics: string;
  hiragana: string;
  romanizationLabel: string;
  transliteration: string;
  phraseGuide: string;
  showPinyin: string;
  hidePinyin: string;
  showJyutping: string;
  hideJyutping: string;
  pinyin: string;
  jyutping: string;
  play: string;
  saved: string;
  save: string;
  hideMeaning: string;
  showMeaning: string;
  meaningIn: string;
  sayItAloud: string;
  listen: string;
  slow: string;
  azureVoice: string;
  holdToSpeakAria: string;
  releaseToAssess: string;
  keepHolding: string;
  checking: string;
  holdToSpeak: string;
  pronunciation: string;
  attempt: string;
  attempts: string;
  azureHeard: string;
  lessonNavigation: string;
  previous: string;
  finishSample: string;
  nextSentence: string;
  audioUnavailable: string;
  passedFeedback: string;
  retryFeedback: string;
  sendingRecording: string;
  recordingTooShort: string;
  assessmentError: string;
  assessmentNotConfigured: string;
  startingMicrophone: string;
  listeningNow: string;
  microphoneBlocked: string;
  microphoneError: string;
  content: Record<string, { title: string; description: string }>;
};

const baseLanguageLearningUi: Record<Exclude<LanguageId, "zht">, LanguageLearningUiCopy> = {
  en: {
    brandSubtitle: "speaking lab", backToSpace: "Back to space", navigationLabel: "Language lab navigation", appLabel: "Lilt language learning app", lessons: "Lessons", story: "Story", counting: "Counting",
    localProgress: "Local learning progress", xp: "{count} XP", savedCount: "{count} saved",
    changeSystemLanguage: "Change interface language", systemLanguage: "Interface language",
    chooseLesson: "Choose a short lesson", chooseLessonHelp: "Pick a scene, then practice every sentence by speaking it.",
    learningLanguage: "Learning language", displayedLanguages: "Displayed languages",
    chooseDisplayedLanguages: "Choose displayed languages", noDisplayedLanguages: "No help languages",
    toneWarning: "Azure does not return a separate tone score for this language.", availableLessons: "Available lessons",
    openLesson: "Open {lesson}", minutes: "{count} min", completedCount: "{count} of {total} complete",
    promptsCount: "{count} prompts", continue: "Continue", start: "Start", practiceIn: "{language} practice",
    promptProgress: "Prompt {count} of {total}", sampleComplete: "Sample complete",
    sampleCompleteBody: "You worked through {count} prompts in {language}. Progress is saved on this device.",
    practiceAgain: "Practice again", chooseAnotherLesson: "Choose another lesson", sayThisNumber: "Say this number",
    supportReader: "Support language reader", supportHelp: "Swipe a language left to remove it. Drag its handle to reorder it.",
    remove: "Remove", playSentence: "Play {language} sentence",
    reorderLanguage: "Reorder {language}. Use arrow keys to move or Delete to remove.",
    addLanguage: "Add language", allLanguagesAdded: "All languages added", showRomanization: "Show romanization",
    phraseDetails: "Phrase details", closePhraseDetails: "Close phrase details", phraseIn: "{language} phrase",
    characterDetails: "Character details", closeCharacterDetails: "Close character details", characterIn: "{language} character",
    wordDetails: "Word details", closeWordDetails: "Close word details", wordIn: "{language} word", backToPhrase: "Back to phrase",
    pronunciationGuide: "Pronunciation", pronunciationOff: "Off", englishPhonetics: "English phonetics", hiragana: "Hiragana",
    romanizationLabel: "Romanization", transliteration: "Transliteration", phraseGuide: "Phrase guide",
    showPinyin: "Show Pinyin", hidePinyin: "Hide Pinyin", showJyutping: "Show Jyutping", hideJyutping: "Hide Jyutping", pinyin: "Pinyin", jyutping: "Jyutping",
    play: "Play", saved: "Saved", save: "Save", hideMeaning: "Hide meaning", showMeaning: "Show meaning",
    meaningIn: "Meaning in {language}", sayItAloud: "Say it aloud", listen: "Listen", slow: "Slow",
    azureVoice: "Azure neural voice", holdToSpeakAria: "Hold to speak and release to assess",
    releaseToAssess: "Release to assess", keepHolding: "Keep holding", checking: "Checking", holdToSpeak: "Hold to speak",
    pronunciation: "pronunciation", attempt: "attempt", attempts: "attempts", azureHeard: "Azure heard:",
    lessonNavigation: "Lesson sentence navigation", previous: "Previous", finishSample: "Finish sample", nextSentence: "Next sentence",
    audioUnavailable: "Audio playback is unavailable in this browser.",
    passedFeedback: "Nice work. The next sentence is unlocked.", retryFeedback: "Try again after listening to the sentence slowly.",
    sendingRecording: "Sending this short recording for pronunciation assessment.",
    recordingTooShort: "The recording was too short. Hold the button long enough to say the full sentence.",
    assessmentError: "The assessment service could not score that attempt. Your attempt was not counted; please try again.",
    assessmentNotConfigured: "Speech assessment is not configured for this deployment yet.",
    startingMicrophone: "Keep holding while microphone access starts.",
    listeningNow: "Listening now. Keep holding while you say the full sentence.",
    microphoneBlocked: "Microphone access was blocked. Allow it in your browser settings and try again.",
    microphoneError: "The microphone could not start in this browser. Try current Chrome, Edge, Firefox, or Safari.",
    content: {
      "story-market-morning-v1": { title: "A morning at the market", description: "Three useful sentences for buying fruit and greeting a shopkeeper." },
      "story-rainy-walk-v1": { title: "A rainy walk", description: "Three everyday sentences about rain, umbrellas, and puddles." },
      "numbers-one-to-five-v1": { title: "Count from one to twenty", description: "Build a quick speaking rhythm with the first twenty numbers." },
    },
  },
  zh: {
    brandSubtitle: "口语练习", backToSpace: "返回空间", navigationLabel: "语言学习导航", appLabel: "Lilt 语言学习应用", lessons: "课程", story: "故事", counting: "数数",
    localProgress: "本地学习进度", xp: "{count} 经验值", savedCount: "已收藏 {count} 个",
    changeSystemLanguage: "更改界面语言", systemLanguage: "界面语言",
    chooseLesson: "选择一个短课程", chooseLessonHelp: "选择一个场景，然后通过朗读练习每个句子。",
    learningLanguage: "学习语言", displayedLanguages: "显示语言", chooseDisplayedLanguages: "选择显示语言", noDisplayedLanguages: "不显示辅助语言",
    toneWarning: "Azure 不会为此语言单独提供声调分数。", availableLessons: "可选课程", openLesson: "打开{lesson}",
    minutes: "{count} 分钟", completedCount: "已完成 {count}/{total}", promptsCount: "{count} 个练习",
    continue: "继续", start: "开始", practiceIn: "{language}练习", promptProgress: "第 {count}/{total} 题",
    sampleComplete: "练习完成", sampleCompleteBody: "你已完成 {language}的 {count} 个练习。进度已保存在此设备上。",
    practiceAgain: "再次练习", chooseAnotherLesson: "选择其他课程", sayThisNumber: "读出这个数字",
    supportReader: "辅助语言阅读区", supportHelp: "向左滑动可移除语言，拖动手柄可重新排序。", remove: "移除",
    playSentence: "播放{language}句子", reorderLanguage: "重新排列{language}。使用方向键移动，或按 Delete 移除。",
    addLanguage: "添加语言", allLanguagesAdded: "已添加所有语言", showRomanization: "显示罗马字",
    phraseDetails: "短语详情", closePhraseDetails: "关闭短语详情", phraseIn: "{language}短语", play: "播放",
    characterDetails: "汉字详情", closeCharacterDetails: "关闭汉字详情", characterIn: "{language}汉字",
    wordDetails: "词语详情", closeWordDetails: "关闭词语详情", wordIn: "{language}词语", backToPhrase: "返回短语",
    pronunciationGuide: "发音辅助", pronunciationOff: "关闭", englishPhonetics: "英语读音", hiragana: "平假名",
    romanizationLabel: "罗马字", transliteration: "转写", phraseGuide: "短语发音",
    showPinyin: "显示拼音", hidePinyin: "隐藏拼音", showJyutping: "显示粤拼", hideJyutping: "隐藏粤拼", pinyin: "拼音", jyutping: "粤拼",
    saved: "已收藏", save: "收藏", hideMeaning: "隐藏含义", showMeaning: "显示含义", meaningIn: "{language}含义",
    sayItAloud: "大声读出来", listen: "听发音", slow: "慢速", azureVoice: "Azure 神经语音",
    holdToSpeakAria: "按住说话，松开后评分", releaseToAssess: "松开并评分", keepHolding: "请继续按住", checking: "评分中",
    holdToSpeak: "按住说话", pronunciation: "发音", attempt: "次尝试", attempts: "次尝试", azureHeard: "Azure 听到：",
    lessonNavigation: "课程句子导航", previous: "上一个", finishSample: "完成练习", nextSentence: "下一个句子",
    audioUnavailable: "此浏览器无法播放音频。", passedFeedback: "很好，下一个句子已解锁。", retryFeedback: "先听慢速发音，然后再试一次。",
    sendingRecording: "正在发送录音进行发音评估。", recordingTooShort: "录音太短。请按住按钮并完整读出句子。",
    assessmentError: "评分服务无法处理这次尝试。本次不计入次数，请重试。", assessmentNotConfigured: "此部署尚未配置语音评分。",
    startingMicrophone: "麦克风启动时请继续按住。", listeningNow: "正在聆听。朗读完整句子时请继续按住。",
    microphoneBlocked: "麦克风权限被阻止。请在浏览器设置中允许访问后重试。", microphoneError: "此浏览器无法启动麦克风。请使用最新版 Chrome、Edge、Firefox 或 Safari。",
    content: {
      "story-market-morning-v1": { title: "市场里的早晨", description: "练习购买水果和向店主问候的三个实用句子。" },
      "story-rainy-walk-v1": { title: "雨中散步", description: "练习关于雨、雨伞和水洼的三个日常句子。" },
      "numbers-one-to-five-v1": { title: "从一数到二十", description: "用前二十个数字建立流畅的口语节奏。" },
    },
  },
  yue: {
    brandSubtitle: "口語練習", backToSpace: "返回空間", navigationLabel: "語言學習導覽", appLabel: "Lilt 語言學習應用", lessons: "課堂", story: "故事", counting: "數數",
    localProgress: "本機學習進度", xp: "{count} 經驗值", savedCount: "已收藏 {count} 個",
    changeSystemLanguage: "更改介面語言", systemLanguage: "介面語言",
    chooseLesson: "揀一個短課堂", chooseLessonHelp: "揀一個場景，再開聲練習每一句。",
    learningLanguage: "學習語言", displayedLanguages: "顯示語言", chooseDisplayedLanguages: "選擇顯示語言", noDisplayedLanguages: "唔顯示輔助語言",
    toneWarning: "Azure 唔會為呢種語言另外提供聲調分數。", availableLessons: "可選課堂", openLesson: "開啟{lesson}",
    minutes: "{count} 分鐘", completedCount: "完成咗 {count}/{total}", promptsCount: "{count} 個練習",
    continue: "繼續", start: "開始", practiceIn: "{language}練習", promptProgress: "第 {count}/{total} 題",
    sampleComplete: "練習完成", sampleCompleteBody: "你完成咗 {language}嘅 {count} 個練習。進度已儲存喺呢部裝置。",
    practiceAgain: "再練習", chooseAnotherLesson: "揀另一個課堂", sayThisNumber: "讀出呢個數字",
    supportReader: "輔助語言閱讀區", supportHelp: "向左掃可以刪除語言，拖動手柄可以重新排序。", remove: "刪除",
    playSentence: "播放{language}句子", reorderLanguage: "重新排列{language}。用方向鍵移動，或者按 Delete 刪除。",
    addLanguage: "加入語言", allLanguagesAdded: "已加入所有語言", showRomanization: "顯示拼音",
    phraseDetails: "短語詳情", closePhraseDetails: "關閉短語詳情", phraseIn: "{language}短語", play: "播放",
    characterDetails: "漢字詳情", closeCharacterDetails: "關閉漢字詳情", characterIn: "{language}漢字",
    wordDetails: "詞語詳情", closeWordDetails: "關閉詞語詳情", wordIn: "{language}詞語", backToPhrase: "返回短語",
    pronunciationGuide: "發音輔助", pronunciationOff: "關閉", englishPhonetics: "英語讀音", hiragana: "平假名",
    romanizationLabel: "羅馬字", transliteration: "轉寫", phraseGuide: "短語發音",
    showPinyin: "顯示拼音", hidePinyin: "隱藏拼音", showJyutping: "顯示粵拼", hideJyutping: "隱藏粵拼", pinyin: "拼音", jyutping: "粵拼",
    saved: "已收藏", save: "收藏", hideMeaning: "隱藏意思", showMeaning: "顯示意思", meaningIn: "{language}意思",
    sayItAloud: "大聲讀出嚟", listen: "聽發音", slow: "慢速", azureVoice: "Azure 神經語音",
    holdToSpeakAria: "按住講話，放手後評分", releaseToAssess: "放手並評分", keepHolding: "繼續按住", checking: "評分中",
    holdToSpeak: "按住講話", pronunciation: "發音", attempt: "次嘗試", attempts: "次嘗試", azureHeard: "Azure 聽到：",
    lessonNavigation: "課堂句子導覽", previous: "上一句", finishSample: "完成練習", nextSentence: "下一句",
    audioUnavailable: "呢個瀏覽器無法播放音訊。", passedFeedback: "做得好，下一句已經解鎖。", retryFeedback: "先聽慢速發音，再試一次。",
    sendingRecording: "正在傳送錄音作發音評估。", recordingTooShort: "錄音太短。請按住按鈕並完整讀出句子。",
    assessmentError: "評分服務無法處理今次嘗試。今次唔會計算，請再試。", assessmentNotConfigured: "呢個部署仲未設定語音評分。",
    startingMicrophone: "咪高峰啟動時請繼續按住。", listeningNow: "而家聽緊。讀完整句子時請繼續按住。",
    microphoneBlocked: "咪高峰權限被封鎖。請喺瀏覽器設定允許後再試。", microphoneError: "呢個瀏覽器無法啟動咪高峰。請用最新版 Chrome、Edge、Firefox 或 Safari。",
    content: {
      "story-market-morning-v1": { title: "街市嘅早晨", description: "練習買水果同向店主打招呼嘅三句實用說話。" },
      "story-rainy-walk-v1": { title: "雨中散步", description: "練習關於落雨、雨遮同水氹嘅三句日常說話。" },
      "numbers-one-to-five-v1": { title: "由一數到二十", description: "用頭二十個數字建立流暢嘅口語節奏。" },
    },
  },
  ja: {
    brandSubtitle: "スピーキング練習", backToSpace: "スペースに戻る", navigationLabel: "言語ラボのナビゲーション", appLabel: "Lilt 言語学習アプリ", lessons: "レッスン", story: "ストーリー", counting: "数字",
    localProgress: "端末内の学習記録", xp: "{count} XP", savedCount: "保存済み {count}件",
    changeSystemLanguage: "表示言語を変更", systemLanguage: "表示言語",
    chooseLesson: "短いレッスンを選ぶ", chooseLessonHelp: "場面を選び、各文を声に出して練習します。",
    learningLanguage: "学ぶ言語", displayedLanguages: "表示する言語", chooseDisplayedLanguages: "表示する言語を選択", noDisplayedLanguages: "補助言語なし",
    toneWarning: "Azure はこの言語の声調を個別に採点しません。", availableLessons: "レッスン一覧", openLesson: "{lesson}を開く",
    minutes: "{count}分", completedCount: "{total}問中{count}問完了", promptsCount: "{count}問",
    continue: "続ける", start: "始める", practiceIn: "{language}の練習", promptProgress: "{total}問中{count}問目",
    sampleComplete: "練習完了", sampleCompleteBody: "{language}で{count}問を練習しました。進捗はこの端末に保存されています。",
    practiceAgain: "もう一度練習", chooseAnotherLesson: "別のレッスンを選ぶ", sayThisNumber: "この数字を言う",
    supportReader: "補助言語リーダー", supportHelp: "左にスワイプして言語を削除し、ハンドルをドラッグして並べ替えます。", remove: "削除",
    playSentence: "{language}の文を再生", reorderLanguage: "{language}を並べ替えます。矢印キーで移動し、Deleteキーで削除できます。",
    addLanguage: "言語を追加", allLanguagesAdded: "すべて追加済み", showRomanization: "ローマ字を表示",
    phraseDetails: "フレーズ詳細", closePhraseDetails: "フレーズ詳細を閉じる", phraseIn: "{language}のフレーズ", play: "再生",
    characterDetails: "漢字の詳細", closeCharacterDetails: "漢字の詳細を閉じる", characterIn: "{language}の漢字",
    wordDetails: "単語の詳細", closeWordDetails: "単語の詳細を閉じる", wordIn: "{language}の単語", backToPhrase: "フレーズに戻る",
    pronunciationGuide: "発音ガイド", pronunciationOff: "オフ", englishPhonetics: "英語式の発音", hiragana: "ひらがな",
    romanizationLabel: "ローマ字", transliteration: "翻字", phraseGuide: "フレーズの発音",
    showPinyin: "ピンインを表示", hidePinyin: "ピンインを隠す", showJyutping: "粤拼を表示", hideJyutping: "粤拼を隠す", pinyin: "ピンイン", jyutping: "粤拼",
    saved: "保存済み", save: "保存", hideMeaning: "意味を隠す", showMeaning: "意味を表示", meaningIn: "{language}での意味",
    sayItAloud: "声に出して言う", listen: "聞く", slow: "ゆっくり", azureVoice: "Azure ニューラル音声",
    holdToSpeakAria: "押している間話し、離して採点", releaseToAssess: "離して採点", keepHolding: "押し続ける", checking: "採点中",
    holdToSpeak: "押して話す", pronunciation: "発音", attempt: "回", attempts: "回", azureHeard: "Azure の認識：",
    lessonNavigation: "レッスン内の文を移動", previous: "前へ", finishSample: "練習を終了", nextSentence: "次の文",
    audioUnavailable: "このブラウザでは音声を再生できません。", passedFeedback: "よくできました。次の文に進めます。", retryFeedback: "ゆっくりした音声を聞いて、もう一度試してください。",
    sendingRecording: "発音評価のため録音を送信しています。", recordingTooShort: "録音が短すぎます。ボタンを押したまま文全体を話してください。",
    assessmentError: "評価サービスが採点できませんでした。この試行は回数に含まれません。もう一度お試しください。", assessmentNotConfigured: "この環境では音声評価がまだ設定されていません。",
    startingMicrophone: "マイクの起動中も押し続けてください。", listeningNow: "聞いています。文全体を話す間、押し続けてください。",
    microphoneBlocked: "マイクへのアクセスがブロックされています。ブラウザ設定で許可してから再試行してください。", microphoneError: "このブラウザではマイクを起動できません。最新版の Chrome、Edge、Firefox、Safari をお試しください。",
    content: {
      "story-market-morning-v1": { title: "市場の朝", description: "果物を買い、店員に挨拶するための便利な3文です。" },
      "story-rainy-walk-v1": { title: "雨の日の散歩", description: "雨、傘、水たまりについての身近な3文です。" },
      "numbers-one-to-five-v1": { title: "1から20まで数える", description: "最初の20個の数字で、話すリズムを身につけます。" },
    },
  },
  ko: {
    brandSubtitle: "말하기 연습", backToSpace: "공간으로 돌아가기", navigationLabel: "언어 학습 탐색", appLabel: "Lilt 언어 학습 앱", lessons: "레슨", story: "이야기", counting: "숫자 세기",
    localProgress: "기기 학습 진도", xp: "{count} XP", savedCount: "{count}개 저장",
    changeSystemLanguage: "화면 언어 변경", systemLanguage: "화면 언어",
    chooseLesson: "짧은 레슨을 선택하세요", chooseLessonHelp: "장면을 고른 뒤 각 문장을 소리 내어 연습하세요.",
    learningLanguage: "배울 언어", displayedLanguages: "표시할 언어", chooseDisplayedLanguages: "표시할 언어 선택", noDisplayedLanguages: "도움 언어 없음",
    toneWarning: "Azure는 이 언어의 성조를 별도로 채점하지 않습니다.", availableLessons: "레슨 목록", openLesson: "{lesson} 열기",
    minutes: "{count}분", completedCount: "{total}개 중 {count}개 완료", promptsCount: "{count}개 연습",
    continue: "계속", start: "시작", practiceIn: "{language} 연습", promptProgress: "{total}개 중 {count}번째",
    sampleComplete: "연습 완료", sampleCompleteBody: "{language}로 {count}개 문장을 연습했습니다. 진도는 이 기기에 저장됩니다.",
    practiceAgain: "다시 연습", chooseAnotherLesson: "다른 레슨 선택", sayThisNumber: "이 숫자를 말하세요",
    supportReader: "도움 언어 영역", supportHelp: "왼쪽으로 밀어 언어를 삭제하고 손잡이를 끌어 순서를 바꾸세요.", remove: "삭제",
    playSentence: "{language} 문장 재생", reorderLanguage: "{language} 순서 변경. 화살표 키로 이동하거나 Delete 키로 삭제하세요.",
    addLanguage: "언어 추가", allLanguagesAdded: "모든 언어 추가됨", showRomanization: "로마자 표시",
    phraseDetails: "구문 정보", closePhraseDetails: "구문 정보 닫기", phraseIn: "{language} 구문", play: "재생",
    characterDetails: "한자 정보", closeCharacterDetails: "한자 정보 닫기", characterIn: "{language} 한자",
    wordDetails: "단어 정보", closeWordDetails: "단어 정보 닫기", wordIn: "{language} 단어", backToPhrase: "구문으로 돌아가기",
    pronunciationGuide: "발음 안내", pronunciationOff: "끄기", englishPhonetics: "영어식 발음", hiragana: "히라가나",
    romanizationLabel: "로마자", transliteration: "음역", phraseGuide: "구문 발음",
    showPinyin: "병음 표시", hidePinyin: "병음 숨기기", showJyutping: "Jyutping 표시", hideJyutping: "Jyutping 숨기기", pinyin: "병음", jyutping: "Jyutping",
    saved: "저장됨", save: "저장", hideMeaning: "뜻 숨기기", showMeaning: "뜻 보기", meaningIn: "{language} 뜻",
    sayItAloud: "소리 내어 말하세요", listen: "듣기", slow: "천천히", azureVoice: "Azure 신경망 음성",
    holdToSpeakAria: "누르고 말한 뒤 놓아서 평가", releaseToAssess: "놓아서 평가", keepHolding: "계속 누르세요", checking: "확인 중",
    holdToSpeak: "누르고 말하기", pronunciation: "발음", attempt: "회 시도", attempts: "회 시도", azureHeard: "Azure 인식 결과:",
    lessonNavigation: "레슨 문장 이동", previous: "이전", finishSample: "연습 끝내기", nextSentence: "다음 문장",
    audioUnavailable: "이 브라우저에서는 음성을 재생할 수 없습니다.", passedFeedback: "잘했어요. 다음 문장이 열렸습니다.", retryFeedback: "느린 음성을 들은 뒤 다시 시도하세요.",
    sendingRecording: "발음 평가를 위해 녹음을 보내고 있습니다.", recordingTooShort: "녹음이 너무 짧습니다. 버튼을 누른 채 문장 전체를 말하세요.",
    assessmentError: "평가 서비스가 이번 시도를 채점하지 못했습니다. 시도 횟수에는 포함되지 않으니 다시 시도하세요.", assessmentNotConfigured: "이 배포에는 아직 음성 평가가 설정되지 않았습니다.",
    startingMicrophone: "마이크가 시작되는 동안 계속 누르세요.", listeningNow: "듣고 있습니다. 문장 전체를 말하는 동안 계속 누르세요.",
    microphoneBlocked: "마이크 접근이 차단되었습니다. 브라우저 설정에서 허용한 뒤 다시 시도하세요.", microphoneError: "이 브라우저에서 마이크를 시작할 수 없습니다. 최신 Chrome, Edge, Firefox 또는 Safari를 사용하세요.",
    content: {
      "story-market-morning-v1": { title: "시장에서의 아침", description: "과일을 사고 가게 주인에게 인사할 때 쓰는 세 문장입니다." },
      "story-rainy-walk-v1": { title: "비 오는 날 산책", description: "비, 우산, 물웅덩이에 관한 일상적인 세 문장입니다." },
      "numbers-one-to-five-v1": { title: "1부터 20까지 세기", description: "처음 스무 개 숫자로 자연스러운 말하기 리듬을 익힙니다." },
    },
  },
  ms: {
    brandSubtitle: "latihan pertuturan", backToSpace: "Kembali ke ruang", navigationLabel: "Navigasi makmal bahasa", appLabel: "Aplikasi pembelajaran bahasa Lilt", lessons: "Pelajaran", story: "Cerita", counting: "Mengira",
    localProgress: "Kemajuan pembelajaran setempat", xp: "{count} XP", savedCount: "{count} disimpan",
    changeSystemLanguage: "Tukar bahasa antara muka", systemLanguage: "Bahasa antara muka",
    chooseLesson: "Pilih pelajaran ringkas", chooseLessonHelp: "Pilih satu situasi, kemudian berlatih menyebut setiap ayat.",
    learningLanguage: "Bahasa dipelajari", displayedLanguages: "Bahasa paparan", chooseDisplayedLanguages: "Pilih bahasa paparan", noDisplayedLanguages: "Tiada bahasa bantuan",
    toneWarning: "Azure tidak memberikan skor nada berasingan untuk bahasa ini.", availableLessons: "Pelajaran tersedia", openLesson: "Buka {lesson}",
    minutes: "{count} min", completedCount: "{count} daripada {total} selesai", promptsCount: "{count} latihan",
    continue: "Teruskan", start: "Mula", practiceIn: "Latihan {language}", promptProgress: "Latihan {count} daripada {total}",
    sampleComplete: "Latihan selesai", sampleCompleteBody: "Anda telah menyelesaikan {count} latihan dalam {language}. Kemajuan disimpan pada peranti ini.",
    practiceAgain: "Berlatih lagi", chooseAnotherLesson: "Pilih pelajaran lain", sayThisNumber: "Sebut nombor ini",
    supportReader: "Pembaca bahasa bantuan", supportHelp: "Leret bahasa ke kiri untuk membuangnya. Seret pemegang untuk menyusun semula.", remove: "Buang",
    playSentence: "Mainkan ayat {language}", reorderLanguage: "Susun semula {language}. Gunakan kekunci anak panah atau Delete untuk membuang.",
    addLanguage: "Tambah bahasa", allLanguagesAdded: "Semua bahasa ditambah", showRomanization: "Tunjukkan romanisasi",
    phraseDetails: "Butiran frasa", closePhraseDetails: "Tutup butiran frasa", phraseIn: "Frasa {language}", play: "Main",
    characterDetails: "Butiran aksara", closeCharacterDetails: "Tutup butiran aksara", characterIn: "Aksara {language}",
    wordDetails: "Butiran perkataan", closeWordDetails: "Tutup butiran perkataan", wordIn: "Perkataan {language}", backToPhrase: "Kembali ke frasa",
    pronunciationGuide: "Panduan sebutan", pronunciationOff: "Tutup", englishPhonetics: "Fonetik Inggeris", hiragana: "Hiragana",
    romanizationLabel: "Romanisasi", transliteration: "Transliterasi", phraseGuide: "Sebutan frasa",
    showPinyin: "Tunjukkan Pinyin", hidePinyin: "Sembunyikan Pinyin", showJyutping: "Tunjukkan Jyutping", hideJyutping: "Sembunyikan Jyutping", pinyin: "Pinyin", jyutping: "Jyutping",
    saved: "Disimpan", save: "Simpan", hideMeaning: "Sembunyikan makna", showMeaning: "Tunjukkan makna", meaningIn: "Makna dalam {language}",
    sayItAloud: "Sebut dengan kuat", listen: "Dengar", slow: "Perlahan", azureVoice: "Suara neural Azure",
    holdToSpeakAria: "Tekan dan tahan untuk bercakap, lepaskan untuk dinilai", releaseToAssess: "Lepaskan untuk dinilai", keepHolding: "Terus tahan", checking: "Memeriksa",
    holdToSpeak: "Tahan untuk bercakap", pronunciation: "sebutan", attempt: "cubaan", attempts: "cubaan", azureHeard: "Azure mendengar:",
    lessonNavigation: "Navigasi ayat pelajaran", previous: "Sebelumnya", finishSample: "Tamatkan latihan", nextSentence: "Ayat seterusnya",
    audioUnavailable: "Audio tidak tersedia dalam pelayar ini.", passedFeedback: "Bagus. Ayat seterusnya telah dibuka.", retryFeedback: "Dengar ayat perlahan, kemudian cuba lagi.",
    sendingRecording: "Menghantar rakaman ringkas ini untuk penilaian sebutan.", recordingTooShort: "Rakaman terlalu pendek. Tahan butang cukup lama untuk menyebut ayat penuh.",
    assessmentError: "Perkhidmatan penilaian tidak dapat menilai cubaan ini. Cubaan tidak dikira, sila cuba lagi.", assessmentNotConfigured: "Penilaian pertuturan belum dikonfigurasikan untuk paparan ini.",
    startingMicrophone: "Terus tahan semasa mikrofon dimulakan.", listeningNow: "Sedang mendengar. Terus tahan semasa anda menyebut ayat penuh.",
    microphoneBlocked: "Akses mikrofon disekat. Benarkan dalam tetapan pelayar dan cuba lagi.", microphoneError: "Mikrofon tidak dapat dimulakan dalam pelayar ini. Cuba Chrome, Edge, Firefox atau Safari terkini.",
    content: {
      "story-market-morning-v1": { title: "Pagi di pasar", description: "Tiga ayat berguna untuk membeli buah dan menyapa pekedai." },
      "story-rainy-walk-v1": { title: "Berjalan ketika hujan", description: "Tiga ayat harian tentang hujan, payung dan lopak." },
      "numbers-one-to-five-v1": { title: "Kira dari satu hingga dua puluh", description: "Bina rentak pertuturan dengan dua puluh nombor pertama." },
    },
  },
  fr: {
    brandSubtitle: "atelier oral", backToSpace: "Retour à l'espace", navigationLabel: "Navigation du laboratoire de langues", appLabel: "Application d'apprentissage Lilt", lessons: "Leçons", story: "Histoire", counting: "Compter",
    localProgress: "Progression locale", xp: "{count} XP", savedCount: "{count} enregistrés",
    changeSystemLanguage: "Changer la langue de l'interface", systemLanguage: "Langue de l'interface",
    chooseLesson: "Choisissez une leçon courte", chooseLessonHelp: "Choisissez une scène, puis entraînez-vous à prononcer chaque phrase.",
    learningLanguage: "Langue apprise", displayedLanguages: "Langues affichées", chooseDisplayedLanguages: "Choisir les langues affichées", noDisplayedLanguages: "Aucune langue d'aide",
    toneWarning: "Azure ne fournit pas de note de ton distincte pour cette langue.", availableLessons: "Leçons disponibles", openLesson: "Ouvrir {lesson}",
    minutes: "{count} min", completedCount: "{count} sur {total} terminés", promptsCount: "{count} exercices",
    continue: "Continuer", start: "Commencer", practiceIn: "Pratique du {language}", promptProgress: "Exercice {count} sur {total}",
    sampleComplete: "Exercice terminé", sampleCompleteBody: "Vous avez terminé {count} exercices en {language}. La progression est enregistrée sur cet appareil.",
    practiceAgain: "Recommencer", chooseAnotherLesson: "Choisir une autre leçon", sayThisNumber: "Prononcez ce nombre",
    supportReader: "Zone des langues d'aide", supportHelp: "Balayez une langue vers la gauche pour la supprimer. Faites glisser la poignée pour la réorganiser.", remove: "Supprimer",
    playSentence: "Écouter la phrase en {language}", reorderLanguage: "Réorganiser {language}. Utilisez les flèches ou Suppr pour supprimer.",
    addLanguage: "Ajouter une langue", allLanguagesAdded: "Toutes les langues sont ajoutées", showRomanization: "Afficher la romanisation",
    phraseDetails: "Détails de l'expression", closePhraseDetails: "Fermer les détails", phraseIn: "Expression en {language}", play: "Écouter",
    characterDetails: "Détails du caractère", closeCharacterDetails: "Fermer les détails du caractère", characterIn: "Caractère en {language}",
    wordDetails: "Détails du mot", closeWordDetails: "Fermer les détails du mot", wordIn: "Mot en {language}", backToPhrase: "Retour à l'expression",
    pronunciationGuide: "Prononciation", pronunciationOff: "Masquer", englishPhonetics: "Phonétique anglaise", hiragana: "Hiragana",
    romanizationLabel: "Romanisation", transliteration: "Translittération", phraseGuide: "Prononciation de l'expression",
    showPinyin: "Afficher le pinyin", hidePinyin: "Masquer le pinyin", showJyutping: "Afficher le jyutping", hideJyutping: "Masquer le jyutping", pinyin: "Pinyin", jyutping: "Jyutping",
    saved: "Enregistré", save: "Enregistrer", hideMeaning: "Masquer le sens", showMeaning: "Afficher le sens", meaningIn: "Sens en {language}",
    sayItAloud: "Prononcez à voix haute", listen: "Écouter", slow: "Lentement", azureVoice: "Voix neuronale Azure",
    holdToSpeakAria: "Maintenez pour parler, puis relâchez pour l'évaluation", releaseToAssess: "Relâchez pour évaluer", keepHolding: "Maintenez", checking: "Évaluation",
    holdToSpeak: "Maintenez pour parler", pronunciation: "prononciation", attempt: "essai", attempts: "essais", azureHeard: "Azure a entendu :",
    lessonNavigation: "Navigation dans la leçon", previous: "Précédent", finishSample: "Terminer", nextSentence: "Phrase suivante",
    audioUnavailable: "La lecture audio n'est pas disponible dans ce navigateur.", passedFeedback: "Très bien. La phrase suivante est disponible.", retryFeedback: "Écoutez la phrase lentement, puis réessayez.",
    sendingRecording: "Envoi de l'enregistrement pour l'évaluation de la prononciation.", recordingTooShort: "L'enregistrement est trop court. Maintenez le bouton assez longtemps pour prononcer toute la phrase.",
    assessmentError: "Le service n'a pas pu évaluer cet essai. Il n'est pas compté, veuillez réessayer.", assessmentNotConfigured: "L'évaluation vocale n'est pas encore configurée pour ce déploiement.",
    startingMicrophone: "Continuez à maintenir pendant le démarrage du micro.", listeningNow: "Écoute en cours. Maintenez pendant toute la phrase.",
    microphoneBlocked: "L'accès au micro a été bloqué. Autorisez-le dans le navigateur, puis réessayez.", microphoneError: "Le micro ne peut pas démarrer dans ce navigateur. Essayez une version récente de Chrome, Edge, Firefox ou Safari.",
    content: {
      "story-market-morning-v1": { title: "Un matin au marché", description: "Trois phrases utiles pour acheter des fruits et saluer un commerçant." },
      "story-rainy-walk-v1": { title: "Une promenade sous la pluie", description: "Trois phrases courantes sur la pluie, les parapluies et les flaques." },
      "numbers-one-to-five-v1": { title: "Compter de un à vingt", description: "Trouvez un rythme naturel avec les vingt premiers nombres." },
    },
  },
  es: {
    brandSubtitle: "práctica oral", backToSpace: "Volver al espacio", navigationLabel: "Navegación del laboratorio de idiomas", appLabel: "Aplicación de aprendizaje Lilt", lessons: "Lecciones", story: "Historia", counting: "Números",
    localProgress: "Progreso local", xp: "{count} XP", savedCount: "{count} guardados",
    changeSystemLanguage: "Cambiar idioma de la interfaz", systemLanguage: "Idioma de la interfaz",
    chooseLesson: "Elige una lección corta", chooseLessonHelp: "Elige una escena y practica cada frase en voz alta.",
    learningLanguage: "Idioma que aprendes", displayedLanguages: "Idiomas mostrados", chooseDisplayedLanguages: "Elegir idiomas mostrados", noDisplayedLanguages: "Sin idiomas de ayuda",
    toneWarning: "Azure no ofrece una puntuación tonal separada para este idioma.", availableLessons: "Lecciones disponibles", openLesson: "Abrir {lesson}",
    minutes: "{count} min", completedCount: "{count} de {total} completados", promptsCount: "{count} ejercicios",
    continue: "Continuar", start: "Empezar", practiceIn: "Práctica de {language}", promptProgress: "Ejercicio {count} de {total}",
    sampleComplete: "Ejercicio completado", sampleCompleteBody: "Has completado {count} ejercicios en {language}. El progreso se guarda en este dispositivo.",
    practiceAgain: "Practicar de nuevo", chooseAnotherLesson: "Elegir otra lección", sayThisNumber: "Di este número",
    supportReader: "Área de idiomas de ayuda", supportHelp: "Desliza un idioma a la izquierda para eliminarlo. Arrastra el control para reordenarlo.", remove: "Eliminar",
    playSentence: "Reproducir frase en {language}", reorderLanguage: "Reordenar {language}. Usa las flechas para moverlo o Supr para eliminarlo.",
    addLanguage: "Añadir idioma", allLanguagesAdded: "Todos los idiomas añadidos", showRomanization: "Mostrar romanización",
    phraseDetails: "Detalles de la frase", closePhraseDetails: "Cerrar detalles", phraseIn: "Frase en {language}", play: "Reproducir",
    characterDetails: "Detalles del carácter", closeCharacterDetails: "Cerrar detalles del carácter", characterIn: "Carácter en {language}",
    wordDetails: "Detalles de la palabra", closeWordDetails: "Cerrar detalles de la palabra", wordIn: "Palabra en {language}", backToPhrase: "Volver a la frase",
    pronunciationGuide: "Pronunciación", pronunciationOff: "Ocultar", englishPhonetics: "Fonética inglesa", hiragana: "Hiragana",
    romanizationLabel: "Romanización", transliteration: "Transliteración", phraseGuide: "Pronunciación de la frase",
    showPinyin: "Mostrar pinyin", hidePinyin: "Ocultar pinyin", showJyutping: "Mostrar jyutping", hideJyutping: "Ocultar jyutping", pinyin: "Pinyin", jyutping: "Jyutping",
    saved: "Guardado", save: "Guardar", hideMeaning: "Ocultar significado", showMeaning: "Mostrar significado", meaningIn: "Significado en {language}",
    sayItAloud: "Dilo en voz alta", listen: "Escuchar", slow: "Lento", azureVoice: "Voz neuronal de Azure",
    holdToSpeakAria: "Mantén pulsado para hablar y suelta para evaluar", releaseToAssess: "Suelta para evaluar", keepHolding: "Sigue pulsando", checking: "Evaluando",
    holdToSpeak: "Mantén para hablar", pronunciation: "pronunciación", attempt: "intento", attempts: "intentos", azureHeard: "Azure oyó:",
    lessonNavigation: "Navegación de frases", previous: "Anterior", finishSample: "Terminar", nextSentence: "Frase siguiente",
    audioUnavailable: "El audio no está disponible en este navegador.", passedFeedback: "Muy bien. Ya puedes continuar con la siguiente frase.", retryFeedback: "Escucha la frase lentamente y vuelve a intentarlo.",
    sendingRecording: "Enviando la grabación para evaluar la pronunciación.", recordingTooShort: "La grabación es demasiado corta. Mantén el botón pulsado mientras dices la frase completa.",
    assessmentError: "El servicio no pudo evaluar este intento. No se contará, inténtalo de nuevo.", assessmentNotConfigured: "La evaluación de voz aún no está configurada en este despliegue.",
    startingMicrophone: "Sigue pulsando mientras se inicia el micrófono.", listeningNow: "Escuchando. Sigue pulsando mientras dices la frase completa.",
    microphoneBlocked: "Se bloqueó el acceso al micrófono. Permítelo en el navegador e inténtalo de nuevo.", microphoneError: "No se pudo iniciar el micrófono. Prueba una versión reciente de Chrome, Edge, Firefox o Safari.",
    content: {
      "story-market-morning-v1": { title: "Una mañana en el mercado", description: "Tres frases útiles para comprar fruta y saludar a un vendedor." },
      "story-rainy-walk-v1": { title: "Un paseo bajo la lluvia", description: "Tres frases cotidianas sobre la lluvia, los paraguas y los charcos." },
      "numbers-one-to-five-v1": { title: "Contar del uno al veinte", description: "Crea un ritmo natural con los primeros veinte números." },
    },
  },
  ta: {
    brandSubtitle: "பேச்சுப் பயிற்சி", backToSpace: "இடத்திற்குத் திரும்பு", navigationLabel: "மொழிப் பயிற்சி வழிசெலுத்தல்", appLabel: "Lilt மொழிக் கற்றல் செயலி", lessons: "பாடங்கள்", story: "கதை", counting: "எண்ணுதல்",
    localProgress: "சாதனக் கற்றல் முன்னேற்றம்", xp: "{count} XP", savedCount: "{count} சேமிக்கப்பட்டது",
    changeSystemLanguage: "இடைமுக மொழியை மாற்று", systemLanguage: "இடைமுக மொழி",
    chooseLesson: "ஒரு குறும் பாடத்தைத் தேர்வு செய்க", chooseLessonHelp: "ஒரு காட்சியைத் தேர்ந்து, ஒவ்வொரு வாக்கியத்தையும் உரக்கப் பயிற்சி செய்க.",
    learningLanguage: "கற்கும் மொழி", displayedLanguages: "காட்டப்படும் மொழிகள்", chooseDisplayedLanguages: "காட்டப்படும் மொழிகளைத் தேர்வு செய்க", noDisplayedLanguages: "உதவி மொழிகள் இல்லை",
    toneWarning: "இந்த மொழிக்கு Azure தனியான தொனி மதிப்பெண் வழங்காது.", availableLessons: "கிடைக்கும் பாடங்கள்", openLesson: "{lesson} திற",
    minutes: "{count} நிமி", completedCount: "{total} இல் {count} முடிந்தது", promptsCount: "{count} பயிற்சிகள்",
    continue: "தொடர்க", start: "தொடங்குக", practiceIn: "{language} பயிற்சி", promptProgress: "{total} இல் பயிற்சி {count}",
    sampleComplete: "பயிற்சி முடிந்தது", sampleCompleteBody: "{language} மொழியில் {count} பயிற்சிகளை முடித்தீர்கள். முன்னேற்றம் இந்தச் சாதனத்தில் சேமிக்கப்பட்டுள்ளது.",
    practiceAgain: "மீண்டும் பயிற்சி செய்க", chooseAnotherLesson: "வேறு பாடத்தைத் தேர்வு செய்க", sayThisNumber: "இந்த எண்ணைச் சொல்லுங்கள்",
    supportReader: "உதவி மொழிப் பகுதி", supportHelp: "மொழியை நீக்க இடப்புறம் தேய்க்கவும். வரிசையை மாற்ற பிடியை இழுக்கவும்.", remove: "நீக்கு",
    playSentence: "{language} வாக்கியத்தை இயக்கு", reorderLanguage: "{language} வரிசையை மாற்றுக. நகர்த்த அம்புக்குறி விசைகள், நீக்க Delete விசையைப் பயன்படுத்துக.",
    addLanguage: "மொழி சேர்", allLanguagesAdded: "அனைத்து மொழிகளும் சேர்க்கப்பட்டன", showRomanization: "ரோமன் எழுத்தாக்கத்தைக் காட்டு",
    phraseDetails: "சொற்றொடர் விவரம்", closePhraseDetails: "சொற்றொடர் விவரத்தை மூடு", phraseIn: "{language} சொற்றொடர்", play: "இயக்கு",
    characterDetails: "எழுத்து விவரம்", closeCharacterDetails: "எழுத்து விவரத்தை மூடு", characterIn: "{language} எழுத்து",
    wordDetails: "சொல் விவரம்", closeWordDetails: "சொல் விவரத்தை மூடு", wordIn: "{language} சொல்", backToPhrase: "சொற்றொடருக்குத் திரும்பு",
    pronunciationGuide: "உச்சரிப்பு வழிகாட்டி", pronunciationOff: "மறை", englishPhonetics: "ஆங்கில ஒலிப்பு", hiragana: "ஹிராகானா",
    romanizationLabel: "ரோமன் எழுத்தாக்கம்", transliteration: "ஒலிபெயர்ப்பு", phraseGuide: "சொற்றொடர் உச்சரிப்பு",
    showPinyin: "பின்யினைக் காட்டு", hidePinyin: "பின்யினை மறை", showJyutping: "ஜ்யூட்பிங்கைக் காட்டு", hideJyutping: "ஜ்யூட்பிங்கை மறை", pinyin: "பின்யின்", jyutping: "ஜ்யூட்பிங்",
    saved: "சேமிக்கப்பட்டது", save: "சேமி", hideMeaning: "பொருளை மறை", showMeaning: "பொருளைக் காட்டு", meaningIn: "{language} பொருள்",
    sayItAloud: "உரக்கச் சொல்லுங்கள்", listen: "கேள்", slow: "மெதுவாக", azureVoice: "Azure நரம்பியல் குரல்",
    holdToSpeakAria: "பேச அழுத்திப் பிடித்து, மதிப்பிட விடுங்கள்", releaseToAssess: "மதிப்பிட விடுங்கள்", keepHolding: "தொடர்ந்து பிடியுங்கள்", checking: "சரிபார்க்கிறது",
    holdToSpeak: "பேசப் பிடியுங்கள்", pronunciation: "உச்சரிப்பு", attempt: "முயற்சி", attempts: "முயற்சிகள்", azureHeard: "Azure கேட்டது:",
    lessonNavigation: "பாட வாக்கிய வழிசெலுத்தல்", previous: "முந்தையது", finishSample: "பயிற்சியை முடி", nextSentence: "அடுத்த வாக்கியம்",
    audioUnavailable: "இந்த உலாவியில் ஒலியை இயக்க முடியாது.", passedFeedback: "நன்றாகச் செய்தீர்கள். அடுத்த வாக்கியம் திறக்கப்பட்டது.", retryFeedback: "மெதுவான ஒலியைக் கேட்டுப் பிறகு மீண்டும் முயலுங்கள்.",
    sendingRecording: "உச்சரிப்பு மதிப்பீட்டுக்கு பதிவை அனுப்புகிறது.", recordingTooShort: "பதிவு மிகக் குறுகியது. முழு வாக்கியத்தையும் சொல்லும் வரை பொத்தானைப் பிடியுங்கள்.",
    assessmentError: "இந்த முயற்சியை மதிப்பிட முடியவில்லை. இது கணக்கிடப்படாது, மீண்டும் முயலுங்கள்.", assessmentNotConfigured: "இந்த வெளியீட்டில் பேச்சு மதிப்பீடு இன்னும் அமைக்கப்படவில்லை.",
    startingMicrophone: "ஒலிவாங்கி தொடங்கும் வரை தொடர்ந்து பிடியுங்கள்.", listeningNow: "கேட்கிறது. முழு வாக்கியத்தையும் சொல்லும் வரை பிடியுங்கள்.",
    microphoneBlocked: "ஒலிவாங்கி அணுகல் தடுக்கப்பட்டது. உலாவி அமைப்பில் அனுமதித்து மீண்டும் முயலுங்கள்.", microphoneError: "இந்த உலாவியில் ஒலிவாங்கியைத் தொடங்க முடியவில்லை. புதிய Chrome, Edge, Firefox அல்லது Safari ஐப் பயன்படுத்துக.",
    content: {
      "story-market-morning-v1": { title: "சந்தையில் ஒரு காலை", description: "பழம் வாங்கவும் கடைக்காரரை வாழ்த்தவும் பயன்படும் மூன்று வாக்கியங்கள்." },
      "story-rainy-walk-v1": { title: "மழையில் ஒரு நடை", description: "மழை, குடை, தண்ணீர்க் குட்டைகள் பற்றிய மூன்று அன்றாட வாக்கியங்கள்." },
      "numbers-one-to-five-v1": { title: "ஒன்று முதல் இருபது வரை எண்ணுதல்", description: "முதல் இருபது எண்களுடன் இயல்பான பேச்சுத் தாளத்தை உருவாக்குங்கள்." },
    },
  },
};

const traditionalMandarinUi: LanguageLearningUiCopy = {
  ...baseLanguageLearningUi.zh,
  brandSubtitle: "口語練習",
  backToSpace: "返回空間",
  navigationLabel: "語言學習導覽",
  appLabel: "Lilt 語言學習應用",
  lessons: "課程",
  story: "故事",
  counting: "數數",
  localProgress: "本機學習進度",
  xp: "{count} 經驗值",
  savedCount: "已收藏 {count} 個",
  changeSystemLanguage: "更改介面語言",
  systemLanguage: "介面語言",
  chooseLesson: "選擇一個短課程",
  chooseLessonHelp: "選擇一個場景，然後透過朗讀練習每個句子。",
  learningLanguage: "學習語言",
  displayedLanguages: "顯示語言",
  chooseDisplayedLanguages: "選擇顯示語言",
  noDisplayedLanguages: "不顯示輔助語言",
  toneWarning: "Azure 不會為此語言單獨提供聲調分數。",
  availableLessons: "可選課程",
  openLesson: "開啟{lesson}",
  minutes: "{count} 分鐘",
  completedCount: "已完成 {count}/{total}",
  promptsCount: "{count} 個練習",
  continue: "繼續",
  start: "開始",
  practiceIn: "{language}練習",
  promptProgress: "第 {count}/{total} 題",
  sampleComplete: "練習完成",
  sampleCompleteBody: "你已完成 {language}的 {count} 個練習。進度已儲存在此裝置上。",
  practiceAgain: "再次練習",
  chooseAnotherLesson: "選擇其他課程",
  sayThisNumber: "讀出這個數字",
  supportReader: "輔助語言閱讀區",
  supportHelp: "向左滑動可移除語言，拖動控制點可重新排序。",
  remove: "移除",
  playSentence: "播放{language}句子",
  reorderLanguage: "重新排列{language}。使用方向鍵移動，或按 Delete 移除。",
  addLanguage: "新增語言",
  allLanguagesAdded: "已新增所有語言",
  showRomanization: "顯示羅馬字",
  phraseDetails: "片語詳情",
  closePhraseDetails: "關閉片語詳情",
  phraseIn: "{language}片語",
  characterDetails: "漢字詳情",
  closeCharacterDetails: "關閉漢字詳情",
  characterIn: "{language}漢字",
  wordDetails: "詞語詳情",
  closeWordDetails: "關閉詞語詳情",
  wordIn: "{language}詞語",
  backToPhrase: "返回片語",
  pronunciationGuide: "發音輔助",
  pronunciationOff: "關閉",
  englishPhonetics: "英語讀音",
  hiragana: "平假名",
  romanizationLabel: "羅馬字",
  transliteration: "轉寫",
  phraseGuide: "片語發音",
  showPinyin: "顯示拼音",
  hidePinyin: "隱藏拼音",
  showJyutping: "顯示粵拼",
  hideJyutping: "隱藏粵拼",
  pinyin: "拼音",
  jyutping: "粵拼",
  play: "播放",
  saved: "已收藏",
  save: "收藏",
  hideMeaning: "隱藏含義",
  showMeaning: "顯示含義",
  meaningIn: "{language}含義",
  sayItAloud: "大聲讀出來",
  listen: "聽發音",
  slow: "慢速",
  azureVoice: "Azure 神經語音",
  holdToSpeakAria: "按住說話，放開後評分",
  releaseToAssess: "放開並評分",
  keepHolding: "請繼續按住",
  checking: "評分中",
  holdToSpeak: "按住說話",
  pronunciation: "發音",
  attempt: "次嘗試",
  attempts: "次嘗試",
  azureHeard: "Azure 聽到：",
  lessonNavigation: "課程句子導覽",
  previous: "上一個",
  finishSample: "完成練習",
  nextSentence: "下一個句子",
  audioUnavailable: "此瀏覽器無法播放音訊。",
  passedFeedback: "很好，下一個句子已解鎖。",
  retryFeedback: "先聽慢速發音，然後再試一次。",
  sendingRecording: "正在傳送錄音進行發音評估。",
  recordingTooShort: "錄音太短。請按住按鈕並完整讀出句子。",
  assessmentError: "評分服務無法處理這次嘗試。本次不計入次數，請重試。",
  assessmentNotConfigured: "此部署尚未設定語音評分。",
  startingMicrophone: "麥克風啟動時請繼續按住。",
  listeningNow: "正在聆聽。朗讀完整句子時請繼續按住。",
  microphoneBlocked: "麥克風權限遭到封鎖。請在瀏覽器設定中允許存取後重試。",
  microphoneError: "此瀏覽器無法啟動麥克風。請使用最新版 Chrome、Edge、Firefox 或 Safari。",
  content: {
    "story-market-morning-v1": { title: "市場裡的早晨", description: "練習購買水果和向店主問候的三個實用句子。" },
    "story-rainy-walk-v1": { title: "雨中散步", description: "練習關於雨、雨傘和水窪的三個日常句子。" },
    "numbers-one-to-five-v1": { title: "從一數到二十", description: "用前二十個數字建立流暢的口語節奏。" },
  },
};

export const languageLearningUi: Record<LanguageId, LanguageLearningUiCopy> = {
  ...baseLanguageLearningUi,
  zht: traditionalMandarinUi,
};

export function formatUi(template: string, values: Record<string, string | number>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
