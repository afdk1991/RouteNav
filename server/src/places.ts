// 60+ 热门景点离线数据库
// 覆盖：北京、上海、广州、深圳、成都、杭州、南京、武汉、西安、重庆

export interface OfflinePlace {
  id: string;
  name: string;
  city: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  category: '景点' | '商场' | '美食' | '交通' | '地标';
  keywords: string[];
}

export const offlinePlaces: OfflinePlace[] = [
  // ========== 北京 ==========
  { id: 'bj-001', name: '天安门广场', city: '北京', district: '东城区', address: '北京市东城区天安门广场', latitude: 39.9073, longitude: 116.3910, category: '景点', keywords: ['天安门', '广场', '升旗', '故宫'] },
  { id: 'bj-002', name: '故宫博物院', city: '北京', district: '东城区', address: '北京市东城区景山前街4号', latitude: 39.9163, longitude: 116.3972, category: '景点', keywords: ['故宫', '紫禁城', '博物馆', '皇家'] },
  { id: 'bj-003', name: '王府井大街', city: '北京', district: '东城区', address: '北京市东城区王府井大街', latitude: 39.9143, longitude: 116.4105, category: '商场', keywords: ['王府井', '商业街', '购物'] },
  { id: 'bj-004', name: '长城', city: '北京', district: '延庆区', address: '北京市延庆区八达岭镇', latitude: 40.3576, longitude: 116.5704, category: '景点', keywords: ['长城', '八达岭', '世界遗产'] },
  { id: 'bj-005', name: '颐和园', city: '北京', district: '海淀区', address: '北京市海淀区新建宫门路19号', latitude: 39.9998, longitude: 116.4669, category: '景点', keywords: ['颐和园', '皇家园林', '昆明湖'] },
  { id: 'bj-006', name: '鸟巢', city: '北京', district: '朝阳区', address: '北京市朝阳区国家体育场南路1号', latitude: 39.9909, longitude: 116.3915, category: '地标', keywords: ['鸟巢', '国家体育场', '奥运'] },
  { id: 'bj-007', name: '水立方', city: '北京', district: '朝阳区', address: '北京市朝阳区国家游泳中心', latitude: 39.9926, longitude: 116.3968, category: '地标', keywords: ['水立方', '国家游泳中心'] },
  { id: 'bj-008', name: '南锣鼓巷', city: '北京', district: '东城区', address: '北京市东城区南锣鼓巷', latitude: 39.9379, longitude: 116.4037, category: '景点', keywords: ['南锣鼓巷', '胡同', '老北京'] },
  { id: 'bj-009', name: '三里屯', city: '北京', district: '朝阳区', address: '北京市朝阳区三里屯', latitude: 39.9366, longitude: 116.4497, category: '商场', keywords: ['三里屯', '酒吧', '购物'] },
  { id: 'bj-010', name: '北京站', city: '北京', district: '东城区', address: '北京市东城区毛家湾13号', latitude: 39.9048, longitude: 116.4273, category: '交通', keywords: ['北京站', '火车站'] },
  
  // ========== 上海 ==========
  { id: 'sh-001', name: '外滩', city: '上海', district: '黄浦区', address: '上海市黄浦区中山东一路', latitude: 31.2405, longitude: 121.4901, category: '景点', keywords: ['外滩', '黄浦江', '夜景'] },
  { id: 'sh-002', name: '东方明珠', city: '上海', district: '浦东新区', address: '上海市浦东新区世纪大道1号', latitude: 31.2397, longitude: 121.4998, category: '地标', keywords: ['东方明珠', '电视塔', '地标'] },
  { id: 'sh-003', name: '南京路步行街', city: '上海', district: '黄浦区', address: '上海市黄浦区南京东路', latitude: 31.2353, longitude: 121.4748, category: '商场', keywords: ['南京路', '步行街', '购物'] },
  { id: 'sh-004', name: '城隍庙', city: '上海', district: '黄浦区', address: '上海市黄浦区方浜中路249号', latitude: 31.2279, longitude: 121.4815, category: '景点', keywords: ['城隍庙', '豫园', '小吃'] },
  { id: 'sh-005', name: '上海迪士尼', city: '上海', district: '浦东新区', address: '上海市浦东新区川沙新镇', latitude: 31.1430, longitude: 121.6570, category: '景点', keywords: ['迪士尼', '乐园', '主题公园'] },
  { id: 'sh-006', name: '陆家嘴', city: '上海', district: '浦东新区', address: '上海市浦东新区陆家嘴', latitude: 31.2399, longitude: 121.5019, category: '地标', keywords: ['陆家嘴', '金融中心', '摩天大楼'] },
  { id: 'sh-007', name: '田子坊', city: '上海', district: '黄浦区', address: '上海市黄浦区泰康路210弄', latitude: 31.2148, longitude: 121.4668, category: '景点', keywords: ['田子坊', '弄堂', '文创'] },
  { id: 'sh-008', name: '新天地', city: '上海', district: '黄浦区', address: '上海市黄浦区太仓路', latitude: 31.2228, longitude: 121.4736, category: '商场', keywords: ['新天地', '石库门', '时尚'] },
  { id: 'sh-009', name: '上海站', city: '上海', district: '静安区', address: '上海市静安区秣陵路303号', latitude: 31.2518, longitude: 121.4551, category: '交通', keywords: ['上海站', '火车站'] },
  { id: 'sh-010', name: '虹桥机场', city: '上海', district: '闵行区', address: '上海市闵行区虹桥机场', latitude: 31.1977, longitude: 121.3200, category: '交通', keywords: ['虹桥机场', '机场'] },
  
  // ========== 广州 ==========
  { id: 'gz-001', name: '广州塔', city: '广州', district: '海珠区', address: '广州市海珠区阅江西路222号', latitude: 23.1087, longitude: 113.3189, category: '地标', keywords: ['广州塔', '小蛮腰', '地标'] },
  { id: 'gz-002', name: '北京路步行街', city: '广州', district: '越秀区', address: '广州市越秀区北京路', latitude: 23.1264, longitude: 113.2664, category: '商场', keywords: ['北京路', '步行街', '购物'] },
  { id: 'gz-003', name: '上下九步行街', city: '广州', district: '荔湾区', address: '广州市荔湾区下九路', latitude: 23.1168, longitude: 113.2436, category: '商场', keywords: ['上下九', '步行街', '老广州'] },
  { id: 'gz-004', name: '白云山', city: '广州', district: '白云区', address: '广州市白云区白云山', latitude: 23.1828, longitude: 113.2751, category: '景点', keywords: ['白云山', '森林公园', '登山'] },
  { id: 'gz-005', name: '沙面', city: '广州', district: '荔湾区', address: '广州市荔湾区沙面', latitude: 23.1078, longitude: 113.2441, category: '景点', keywords: ['沙面', '欧式建筑', '租界'] },
  { id: 'gz-006', name: '珠江新城', city: '广州', district: '天河区', address: '广州市天河区珠江新城', latitude: 23.1188, longitude: 113.3242, category: '地标', keywords: ['珠江新城', 'CBD', '摩天大楼'] },
  { id: 'gz-007', name: '长隆野生动物世界', city: '广州', district: '番禺区', address: '广州市番禺区大石街', latitude: 22.9643, longitude: 113.3423, category: '景点', keywords: ['长隆', '动物园', '野生动物'] },
  { id: 'gz-008', name: '广州东站', city: '广州', district: '天河区', address: '广州市天河区林和中路', latitude: 23.1502, longitude: 113.3312, category: '交通', keywords: ['广州东站', '火车站'] },
  { id: 'gz-009', name: '白云机场', city: '广州', district: '白云区', address: '广州市白云区机场路', latitude: 23.3924, longitude: 113.2990, category: '交通', keywords: ['白云机场', '机场'] },
  { id: 'gz-010', name: '陈家祠', city: '广州', district: '荔湾区', address: '广州市荔湾区中山七路', latitude: 23.1299, longitude: 113.2462, category: '景点', keywords: ['陈家祠', '祠堂', '岭南建筑'] },
  
  // ========== 深圳 ==========
  { id: 'sz-001', name: '世界之窗', city: '深圳', district: '南山区', address: '深圳市南山区深南大道9037号', latitude: 22.5374, longitude: 113.9742, category: '景点', keywords: ['世界之窗', '微缩景观', '主题公园'] },
  { id: 'sz-002', name: '欢乐谷', city: '深圳', district: '南山区', address: '深圳市南山区侨城西街18号', latitude: 22.5414, longitude: 113.9815, category: '景点', keywords: ['欢乐谷', '游乐场', '主题公园'] },
  { id: 'sz-003', name: '东部华侨城', city: '深圳', district: '盐田区', address: '深圳市盐田区大梅沙东部华侨城', latitude: 22.5875, longitude: 114.3086, category: '景点', keywords: ['东部华侨城', '大侠谷', '茶溪谷'] },
  { id: 'sz-004', name: '深圳湾公园', city: '深圳', district: '南山区', address: '深圳市南山区深圳湾公园', latitude: 22.4880, longitude: 113.9511, category: '景点', keywords: ['深圳湾', '海滨', '骑行'] },
  { id: 'sz-005', name: '华强北', city: '深圳', district: '福田区', address: '深圳市福田区华强北', latitude: 22.5419, longitude: 114.0866, category: '商场', keywords: ['华强北', '电子', '购物'] },
  { id: 'sz-006', name: '东门老街', city: '深圳', district: '罗湖区', address: '深圳市罗湖区东门老街', latitude: 22.5493, longitude: 114.1322, category: '商场', keywords: ['东门', '老街', '小吃'] },
  { id: 'sz-007', name: '平安金融中心', city: '深圳', district: '福田区', address: '深圳市福田区益田路5033号', latitude: 22.5406, longitude: 114.0565, category: '地标', keywords: ['平安金融中心', '摩天大楼', '地标'] },
  { id: 'sz-008', name: '深圳北站', city: '深圳', district: '龙华区', address: '深圳市龙华区致远中路', latitude: 22.6090, longitude: 114.0287, category: '交通', keywords: ['深圳北站', '火车站', '高铁'] },
  { id: 'sz-009', name: '大梅沙', city: '深圳', district: '盐田区', address: '深圳市盐田区大梅沙', latitude: 22.5958, longitude: 114.3054, category: '景点', keywords: ['大梅沙', '海滩', '海滨'] },
  { id: 'sz-010', name: '小梅沙', city: '深圳', district: '盐田区', address: '深圳市盐田区小梅沙', latitude: 22.6027, longitude: 114.3172, category: '景点', keywords: ['小梅沙', '海滩', '海滨'] },
  
  // ========== 成都 ==========
  { id: 'cd-001', name: '宽窄巷子', city: '成都', district: '青羊区', address: '成都市青羊区长顺街', latitude: 30.6598, longitude: 104.0551, category: '景点', keywords: ['宽窄巷子', '老成都', '小吃'] },
  { id: 'cd-002', name: '锦里', city: '成都', district: '武侯区', address: '成都市武侯区武侯祠大街231号', latitude: 30.6513, longitude: 104.0568, category: '景点', keywords: ['锦里', '古街', '小吃'] },
  { id: 'cd-003', name: '大熊猫基地', city: '成都', district: '成华区', address: '成都市成华区外北熊猫大道1375号', latitude: 30.7375, longitude: 104.1453, category: '景点', keywords: ['熊猫基地', '大熊猫', '基地'] },
  { id: 'cd-004', name: '春熙路', city: '成都', district: '锦江区', address: '成都市锦江区春熙路', latitude: 30.6587, longitude: 104.0826, category: '商场', keywords: ['春熙路', '步行街', '购物'] },
  { id: 'cd-005', name: '太古里', city: '成都', district: '锦江区', address: '成都市锦江区太古里', latitude: 30.6600, longitude: 104.0865, category: '商场', keywords: ['太古里', '时尚', '开放式街区'] },
  { id: 'cd-006', name: '武侯祠', city: '成都', district: '武侯区', address: '成都市武侯区武侯祠大街231号', latitude: 30.6520, longitude: 104.0565, category: '景点', keywords: ['武侯祠', '三国', '祠堂'] },
  { id: 'cd-007', name: '都江堰', city: '成都', district: '都江堰市', address: '成都市都江堰市都江堰景区', latitude: 30.9928, longitude: 103.6053, category: '景点', keywords: ['都江堰', '水利工程', '世界遗产'] },
  { id: 'cd-008', name: '青城山', city: '成都', district: '都江堰市', address: '成都市都江堰市青城山镇', latitude: 30.9016, longitude: 103.5303, category: '景点', keywords: ['青城山', '道教', '登山'] },
  { id: 'cd-009', name: '成都站', city: '成都', district: '金牛区', address: '成都市金牛区站东路1号', latitude: 30.6973, longitude: 104.0675, category: '交通', keywords: ['成都站', '火车站'] },
  { id: 'cd-010', name: '天府广场', city: '成都', district: '锦江区', address: '成都市锦江区天府广场', latitude: 30.6595, longitude: 104.0658, category: '地标', keywords: ['天府广场', '市中心', '地标'] },
  
  // ========== 杭州 ==========
  { id: 'hz-001', name: '西湖', city: '杭州', district: '西湖区', address: '杭州市西湖区西湖', latitude: 30.2467, longitude: 120.1485, category: '景点', keywords: ['西湖', '断桥', '雷峰塔'] },
  { id: 'hz-002', name: '灵隐寺', city: '杭州', district: '西湖区', address: '杭州市西湖区灵隐路法云弄1号', latitude: 30.2348, longitude: 120.0967, category: '景点', keywords: ['灵隐寺', '寺庙', '佛教'] },
  { id: 'hz-003', name: '宋城', city: '杭州', district: '西湖区', address: '杭州市西湖区之江路148号', latitude: 30.1308, longitude: 120.0335, category: '景点', keywords: ['宋城', '演出', '主题公园'] },
  { id: 'hz-004', name: '河坊街', city: '杭州', district: '上城区', address: '杭州市上城区河坊街', latitude: 30.2484, longitude: 120.1595, category: '景点', keywords: ['河坊街', '古街', '小吃'] },
  { id: 'hz-005', name: '京杭大运河', city: '杭州', district: '拱墅区', address: '杭州市拱墅区京杭大运河', latitude: 30.2775, longitude: 120.1379, category: '景点', keywords: ['运河', '水上巴士', '夜景'] },
  { id: 'hz-006', name: '杭州东站', city: '杭州', district: '江干区', address: '杭州市江干区天城路1号', latitude: 30.2911, longitude: 120.2141, category: '交通', keywords: ['杭州东站', '火车站', '高铁'] },
  { id: 'hz-007', name: '钱江新城', city: '杭州', district: '江干区', address: '杭州市江干区钱江新城', latitude: 30.2655, longitude: 120.2126, category: '地标', keywords: ['钱江新城', 'CBD', '灯光秀'] },
  { id: 'hz-008', name: '龙井村', city: '杭州', district: '西湖区', address: '杭州市西湖区龙井村', latitude: 30.2339, longitude: 120.0757, category: '景点', keywords: ['龙井村', '茶园', '龙井茶'] },
  { id: 'hz-009', name: '千岛湖', city: '杭州', district: '淳安县', address: '杭州市淳安县千岛湖', latitude: 29.8827, longitude: 119.0324, category: '景点', keywords: ['千岛湖', '岛屿', '湖泊'] },
  { id: 'hz-010', name: '西溪湿地', city: '杭州', district: '西湖区', address: '杭州市西湖区文二西路', latitude: 30.2645, longitude: 120.0637, category: '景点', keywords: ['西溪湿地', '湿地', '自然'] },
  
  // ========== 南京 ==========
  { id: 'nj-001', name: '中山陵', city: '南京', district: '玄武区', address: '南京市玄武区中山陵', latitude: 32.0603, longitude: 118.8577, category: '景点', keywords: ['中山陵', '孙中山', '陵墓'] },
  { id: 'nj-002', name: '夫子庙', city: '南京', district: '秦淮区', address: '南京市秦淮区夫子庙', latitude: 32.0263, longitude: 118.7842, category: '景点', keywords: ['夫子庙', '秦淮河', '古街'] },
  { id: 'nj-003', name: '明孝陵', city: '南京', district: '玄武区', address: '南京市玄武区钟山风景区', latitude: 32.0594, longitude: 118.8506, category: '景点', keywords: ['明孝陵', '朱元璋', '陵墓'] },
  { id: 'nj-004', name: '南京总统府', city: '南京', district: '玄武区', address: '南京市玄武区长江路292号', latitude: 32.0284, longitude: 118.7890, category: '景点', keywords: ['总统府', '民国', '历史'] },
  { id: 'nj-005', name: '玄武湖', city: '南京', district: '玄武区', address: '南京市玄武区玄武湖', latitude: 32.0588, longitude: 118.7879, category: '景点', keywords: ['玄武湖', '湖泊', '公园'] },
  { id: 'nj-006', name: '新街口', city: '南京', district: '玄武区', address: '南京市玄武区新街口', latitude: 32.0407, longitude: 118.7895, category: '商场', keywords: ['新街口', '商圈', '购物'] },
  { id: 'nj-007', name: '南京站', city: '南京', district: '玄武区', address: '南京市玄武区龙蟠路111号', latitude: 32.0867, longitude: 118.7949, category: '交通', keywords: ['南京站', '火车站'] },
  { id: 'nj-008', name: '南京南站', city: '南京', district: '雨花台区', address: '南京市雨花台区玉兰路8号', latitude: 31.9736, longitude: 118.7875, category: '交通', keywords: ['南京南站', '火车站', '高铁'] },
  { id: 'nj-009', name: '侵华日军南京大屠杀遇难同胞纪念馆', city: '南京', district: '建邺区', address: '南京市建邺区水西门大街418号', latitude: 32.0311, longitude: 118.7386, category: '景点', keywords: ['纪念馆', '大屠杀', '历史'] },
  { id: 'nj-010', name: '老门东', city: '南京', district: '秦淮区', address: '南京市秦淮区老门东', latitude: 32.0243, longitude: 118.7906, category: '景点', keywords: ['老门东', '古街', '小吃'] },
  
  // ========== 武汉 ==========
  { id: 'wh-001', name: '黄鹤楼', city: '武汉', district: '武昌区', address: '武汉市武昌区蛇山西山坡特1号', latitude: 30.5481, longitude: 114.3100, category: '景点', keywords: ['黄鹤楼', '江南三大名楼', '李白'] },
  { id: 'wh-002', name: '武汉大学', city: '武汉', district: '武昌区', address: '武汉市武昌区珞珈山路16号', latitude: 30.5355, longitude: 114.3673, category: '景点', keywords: ['武汉大学', '樱花', '最美大学'] },
  { id: 'wh-003', name: '东湖', city: '武汉', district: '武昌区', address: '武汉市武昌区东湖', latitude: 30.5565, longitude: 114.3928, category: '景点', keywords: ['东湖', '湖泊', '公园'] },
  { id: 'wh-004', name: '户部巷', city: '武汉', district: '武昌区', address: '武汉市武昌区户部巷', latitude: 30.5505, longitude: 114.3021, category: '景点', keywords: ['户部巷', '小吃', '过早'] },
  { id: 'wh-005', name: '江汉路', city: '武汉', district: '江汉区', address: '武汉市江汉区江汉路', latitude: 30.5865, longitude: 114.2809, category: '商场', keywords: ['江汉路', '步行街', '购物'] },
  { id: 'wh-006', name: '武汉站', city: '武汉', district: '洪山区', address: '武汉市洪山区团结大道', latitude: 30.6122, longitude: 114.4040, category: '交通', keywords: ['武汉站', '火车站', '高铁'] },
  { id: 'wh-007', name: '汉口站', city: '武汉', district: '江汉区', address: '武汉市江汉区金墩路', latitude: 30.5965, longitude: 114.2710, category: '交通', keywords: ['汉口站', '火车站'] },
  { id: 'wh-008', name: '长江大桥', city: '武汉', district: '武昌区', address: '武汉市长江大桥', latitude: 30.5450, longitude: 114.2933, category: '地标', keywords: ['长江大桥', '长江', '桥梁'] },
  { id: 'wh-009', name: '昙华林', city: '武汉', district: '武昌区', address: '武汉市武昌区昙华林', latitude: 30.5382, longitude: 114.3167, category: '景点', keywords: ['昙华林', '老街', '文艺'] },
  { id: 'wh-010', name: '光谷', city: '武汉', district: '洪山区', address: '武汉市洪山区光谷', latitude: 30.4773, longitude: 114.4072, category: '商场', keywords: ['光谷', '商圈', '大学城'] },
  
  // ========== 西安 ==========
  { id: 'xa-001', name: '兵马俑', city: '西安', district: '临潼区', address: '西安市临潼区秦始皇帝陵博物院', latitude: 34.3843, longitude: 109.2785, category: '景点', keywords: ['兵马俑', '秦始皇', '世界遗产'] },
  { id: 'xa-002', name: '大雁塔', city: '西安', district: '雁塔区', address: '西安市雁塔区慈恩路1号', latitude: 34.2189, longitude: 108.9632, category: '景点', keywords: ['大雁塔', '佛教', '塔'] },
  { id: 'xa-003', name: '古城墙', city: '西安', district: '碑林区', address: '西安市碑林区城墙', latitude: 34.2617, longitude: 108.9476, category: '景点', keywords: ['城墙', '永宁门', '骑行'] },
  { id: 'xa-004', name: '回民街', city: '西安', district: '莲湖区', address: '西安市莲湖区回民街', latitude: 34.2667, longitude: 108.9446, category: '景点', keywords: ['回民街', '小吃', '清真'] },
  { id: 'xa-005', name: '大唐不夜城', city: '西安', district: '雁塔区', address: '西安市雁塔区大唐不夜城', latitude: 34.2223, longitude: 108.9485, category: '景点', keywords: ['大唐不夜城', '夜景', '灯光秀'] },
  { id: 'xa-006', name: '钟楼', city: '西安', district: '碑林区', address: '西安市碑林区东大街', latitude: 34.2623, longitude: 108.9435, category: '地标', keywords: ['钟楼', '地标', '古城'] },
  { id: 'xa-007', name: '鼓楼', city: '西安', district: '莲湖区', address: '西安市莲湖区西大街', latitude: 34.2651, longitude: 108.9406, category: '地标', keywords: ['鼓楼', '地标', '古城'] },
  { id: 'xa-008', name: '华清池', city: '西安', district: '临潼区', address: '西安市临潼区华清路38号', latitude: 34.3659, longitude: 109.2091, category: '景点', keywords: ['华清池', '温泉', '杨贵妃'] },
  { id: 'xa-009', name: '西安站', city: '西安', district: '新城区', address: '西安市新城区环城北路', latitude: 34.2657, longitude: 108.9567, category: '交通', keywords: ['西安站', '火车站'] },
  { id: 'xa-010', name: '大唐芙蓉园', city: '西安', district: '雁塔区', address: '西安市雁塔区芙蓉西路99号', latitude: 34.2166, longitude: 108.9758, category: '景点', keywords: ['大唐芙蓉园', '仿古', '夜景'] },
  
  // ========== 重庆 ==========
  { id: 'cq-001', name: '洪崖洞', city: '重庆', district: '渝中区', address: '重庆市渝中区嘉陵江滨江路88号', latitude: 29.5627, longitude: 106.5831, category: '景点', keywords: ['洪崖洞', '吊脚楼', '夜景'] },
  { id: 'cq-002', name: '解放碑', city: '重庆', district: '渝中区', address: '重庆市渝中区解放碑', latitude: 29.5588, longitude: 106.5785, category: '地标', keywords: ['解放碑', '商圈', '地标'] },
  { id: 'cq-003', name: '长江索道', city: '重庆', district: '渝中区', address: '重庆市渝中区新华路151号', latitude: 29.5536, longitude: 106.5863, category: '景点', keywords: ['长江索道', '空中巴士', '长江'] },
  { id: 'cq-004', name: '磁器口', city: '重庆', district: '沙坪坝区', address: '重庆市沙坪坝区磁器口', latitude: 29.5789, longitude: 106.4482, category: '景点', keywords: ['磁器口', '古镇', '小吃'] },
  { id: 'cq-005', name: '武隆天生三桥', city: '重庆', district: '武隆区', address: '重庆市武隆区仙女山镇', latitude: 29.4103, longitude: 107.8942, category: '景点', keywords: ['天生三桥', '喀斯特', '世界遗产'] },
  { id: 'cq-006', name: '朝天门', city: '重庆', district: '渝中区', address: '重庆市渝中区朝天门', latitude: 29.5644, longitude: 106.5875, category: '地标', keywords: ['朝天门', '两江交汇', '码头'] },
  { id: 'cq-007', name: '观音桥', city: '重庆', district: '江北区', address: '重庆市江北区观音桥', latitude: 29.5762, longitude: 106.5589, category: '商场', keywords: ['观音桥', '商圈', '购物'] },
  { id: 'cq-008', name: '重庆站', city: '重庆', district: '南岸区', address: '重庆市南岸区重庆站', latitude: 29.5496, longitude: 106.5608, category: '交通', keywords: ['重庆站', '火车站'] },
  { id: 'cq-009', name: '重庆北站', city: '重庆', district: '渝北区', address: '重庆市渝北区昆仑大道', latitude: 29.6095, longitude: 106.5509, category: '交通', keywords: ['重庆北站', '火车站', '高铁'] },
  { id: 'cq-010', name: '鹅岭公园', city: '重庆', district: '渝中区', address: '重庆市渝中区鹅岭正街', latitude: 29.5519, longitude: 106.5322, category: '景点', keywords: ['鹅岭公园', '公园', '俯瞰'] },
];

// 搜索函数
export function searchPlaces(query: string): OfflinePlace[] {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  
  return offlinePlaces.filter(place => {
    return (
      place.name.toLowerCase().includes(lowerQuery) ||
      place.city.toLowerCase().includes(lowerQuery) ||
      place.district.toLowerCase().includes(lowerQuery) ||
      place.address.toLowerCase().includes(lowerQuery) ||
      place.keywords.some(k => k.toLowerCase().includes(lowerQuery))
    );
  }).slice(0, 10); // 最多返回10条
}

// 根据ID获取地点
export function getPlaceById(id: string): OfflinePlace | undefined {
  return offlinePlaces.find(place => place.id === id);
}

// 根据城市获取地点
export function getPlacesByCity(city: string): OfflinePlace[] {
  return offlinePlaces.filter(place => place.city === city);
}
