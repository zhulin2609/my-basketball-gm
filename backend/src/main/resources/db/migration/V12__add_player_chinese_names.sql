alter table players add column chinese_name text;

update players
set chinese_name = case catalog_key
  when 'jordan' then '迈克尔·乔丹'
  when 'lebron' then '勒布朗·詹姆斯'
  when 'curry' then '斯蒂芬·库里'
  when 'duncan' then '蒂姆·邓肯'
  when 'shaq' then '沙奎尔·奥尼尔'
  when 'magic' then '埃尔文·约翰逊'
  when 'bird' then '拉里·伯德'
  when 'olajuwon' then '哈基姆·奥拉朱旺'
  when 'kobe' then '科比·布莱恩特'
  when 'garnett' then '凯文·加内特'
  when 'durant' then '凯文·杜兰特'
  when 'rodman' then '丹尼斯·罗德曼'
  when 'harden' then '詹姆斯·哈登'
  when 'leonard' then '科怀·伦纳德'
  when 'kerr' then '史蒂夫·科尔'
  when 'miller' then '雷吉·米勒'
  when 'allen' then '雷·阿伦'
  when 'thompson' then '克莱·汤普森'
  when 'jokic' then '尼古拉·约基奇'
end
where is_custom = false;
