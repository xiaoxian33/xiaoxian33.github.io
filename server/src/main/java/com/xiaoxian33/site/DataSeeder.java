package com.xiaoxian33.site;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 旧文导入器（只跑一次）
 * ------------------------------------------------------------
 * 🟢【核心】做的事：
 *   服务启动时看一眼 essay 表 —— 如果是空的，就把以前写在 HTML 里的随笔灌进去；
 *   如果已经有数据，就什么都不做（不会重复插入）。
 *
 * 以后你在管理页里自己增删改，这段代码就用不上了。
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final EssayRepository essayRepository;
    private final ProfileRepository profileRepository;

    public DataSeeder(EssayRepository essayRepository, ProfileRepository profileRepository) {
        this.essayRepository = essayRepository;
        this.profileRepository = profileRepository;
    }

    @Override
    public void run(String... args) {
        seedEssays();
        seedProfile();
    }

    /** 把旧文搬进 essay 表（只搬一次） */
    private void seedEssays() {
        long existing = essayRepository.count();
        if (existing > 0) {
            System.out.println("[DataSeeder] essay 表已有 " + existing + " 篇，跳过导入");
            return;
        }

        List<Essay> essays = List.of(
            new Essay(LocalDate.of(2025, 4, 23), null, """
                我还没能熟练掌握让吸进去的烟完美地从肺里呼出，吸得很顺时，总会有小小的成就感。但大多数时候，它们总会趁我不注意，用力地顶上我的喉咙。

                今天天气很潮湿，现在正在下雨。

                小鱼老师昨晚深夜发给我她写的散文，她说想有一件屋子，把我也加进了她的屋子里。我们有很久没有见面，明明是酸涩地盯着电脑屏幕，感觉却把我带回高三的夜晚。和她熄了灯跑去吹头发，又晃晃荡荡经过潮湿黏腻的空气，她环着我的腰溜进我的宿舍，非要拉着人听她和她喜欢的女老师的故事。

                我们偶然谈起高中追过我的女同学，为她贴上这个标签我实在抱歉，但她对我很好，好到我认为这是一种浪漫的追求。

                我应该还保留着和她传过的纸条，我的教室在一楼，她的教室在我对面的四楼。我记得她经常站在四楼向下望着我，隔一段时间就下楼来，像有固定的频率似的，收取我写完的纸条。

                我和她说想要朋友，坐太久校车所以腰很痛，学不会数学……她依着我的作息，在我下午洗完澡准时卡点陪我坐在图书馆，尽管我知道她根本不需要学数学，但她也会耐着性子坐在旁边看我刷数学卷子，说我很棒。

                她说她喜欢我，我说我不知道。我记得她还给我唱歌听，心情好时我也会附和几句。

                不知道为什么想起她，可能是我说我想要朋友，现在没有人对我说那我们做朋友。从刚被雨淋湿过的走廊的椅子，转移进了空调房，屁股还是湿湿的，所以凉凉的。今天明明又潮湿又热。
                """.strip(), 1),

            new Essay(LocalDate.of(2025, 8, 19), null, """
                Gimlet 的味道于我而言太过锐利，又让我想起了冰冷热带鱼。只可惜，痛苦来源于痛苦的产生并非生活。生活就是很痛的吗？我的生活只是黏腻的，厚重的。把接触面积实在过大的两块岩石用力地撞击。除了发出已经失去生命力的喊声，不会发生其余任何坏事。

                如果我的痛苦也有形就好了，再恐怖也不过猜火车在天花板爬行的小孩。如果我真的有苦难可以痛苦，像 Gimlet 一样的苦难。我克制不住自己不去浇灌他们。缓缓地生长缠上我后再割开。只可惜没有，所以我无法原谅自己。
                """.strip(), 2),

            new Essay(LocalDate.of(2025, 9, 17), null, """
                世界上居然有這麼多人，這麼多的車。這麼多忙碌而無聊的生命，看著他們就像小時候站在陽台上，看家對面的河裡死了一條狗，一天一天腐爛，逐漸被白色的驅蟲啃食，直到露出白骨。
                """.strip(), 3),

            new Essay(LocalDate.of(2025, 10, 20), null, """
                每個秋冬都很難熬，零碎的高中記憶裡，秋冬總是一個人最後一個出宿舍上晚自習，走在那條路上，心裡滿是恨意。秋冬的中午晚上走在五樓的連廊，想要跳下去，報復學校，報復老師，給同學放假。

                今天在珠海的天台抽煙，才感覺秋天真的來了。離開了高中的秋冬，就連想死也變得純粹。我只想在這樣的秋冬裡，死在不被人打擾的郊外。

                但是我有太多朋友沒有再見一面，但究竟又有誰真正走進了我的心裡。其實我也不想告知你們，我感覺沒有辦法忍受又一個秋冬了，上高中之後的每個秋冬我都很痛苦。

                那一刻我太想死了，但是我還得回家，坐在這趟車上，我能想到的辦法只是再吃一顆抗抑郁藥。

                上高中的時候我以為過了十八歲的自殺毫無意義。但如果我能在接下來的任何一個秋冬死了，我也會對我的生命很滿意的。
                """.strip(), 4),

            new Essay(LocalDate.of(2025, 12, 15), null, """
                如果如熱帶魚生活在冰水裡一樣能夠被劇烈反應的疼痛，不得不像冰冷熱帶魚裡面一樣殺妻自殺的疼痛，這種痛苦又怎麼不是痛苦的安慰劑。可正如熱帶魚生活在溫水裡被卡住，加繆說的那段一無事事後的絕望。我不懂為什麼人類窮其一生無法得到滿足，是我想要的太多了嗎，還是我想要的太少了。
                """.strip(), 5),

            new Essay(LocalDate.of(2025, 12, 17), null, """
                我討厭這種外部逐漸縮小，自我逐漸放大，只能感知到我自己的沒有太陽的黃昏。
                """.strip(), 6),

            new Essay(LocalDate.of(2025, 12, 20), null, """
                沒辦法在愛與恨之間尋求一個上下四分點。愛和恨都恨極端，沒有人教過我怎麼才能柔和地讓自己被看見，柔和地愛恨，我只會完全的把一切藏起來，或者猛烈地嘔出所有的一切。但是兩者又是相互的代償，我接得住這些情緒在那一刻爆發或者無意識的隱藏。不知道怎麼處理這樣細水長流的平靜情緒，僅僅多停留一秒鐘都讓我焦慮到要發瘋。
                """.strip(), 7),

            new Essay(LocalDate.of(2026, 7, 20), null, """
                只要好看就会被注意的城市真恶心，欲望的泡沫破碎的一秒只有黏腻和刺鼻。这里什么都没有留下除了腥臭的体液和无知的脑子。
                """.strip(), 8)
        );

        essayRepository.saveAll(essays);
        System.out.println("[DataSeeder] 已导入 " + essays.size() + " 篇旧文到 essay 表");
    }

    /** 把现在的资料（名字 / 一句话 / 简介 / 图片路径）搬进 profile 表（只搬一次） */
    private void seedProfile() {
        if (profileRepository.count() > 0) {
            System.out.println("[DataSeeder] profile 表已有资料，跳过");
            return;
        }

        Profile profile = new Profile();
        profile.setName("张书贤");
        profile.setTagline("把每一次作业，都做成作品");
        profile.setIntro("""
                计算机专业在读 · 喜欢 Java，也喜欢一切「能真的跑起来」的东西
                在做项目、在写代码，也在慢慢变成一个更好的人""");
        profile.setAvatarPath("assets/img/avatar.jpg");
        profile.setHeroPath("assets/img/hero-v4.jpg");
        profile.setGithub("https://github.com/xiaoxian33");
        profile.setUpdatedAt(LocalDateTime.now());

        profileRepository.save(profile);
        System.out.println("[DataSeeder] 已写入 profile（我的资料）");
    }
}
