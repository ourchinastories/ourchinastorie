// To my successor: Pro-tip; When you're editing this file, super handy to use
//                  the command jsx --watch staticSrc/ static/pages from the
//                  pages directory and leave it running

// Return first non-null value of list or a default value
function firstNonNullOrDefault(array, def) {
    for (var i = 0; i < array.length; i++) {
        if (array[i]) {
            def = array[i];
            break;
        }
    }

    return def;
}

// Django CSRF Protection; https://docs.djangoproject.com/en/1.8/ref/csrf/#ajax
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = $.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

var csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
    beforeSend: function (xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

var Modal = ReactModal;

var Button = React.createClass({displayName: "Button",
    render: function () {
        var class_string = this.props.class_string ? this.props.class_string : "button";
        var type_string = this.props.type_string ? this.props.type_string : "button";
        var styles = this.props.styles ? this.props.styles : {};

        return (
            React.createElement("button", {type: type_string, style: styles, className: class_string, onClick: this.props.handle_click}, 
                this.props.text
            )
        );
    }
});

var NameHeader = React.createClass({displayName: "NameHeader",
    render: function () {
        var stuff_to_add = [];
        var order_of_headers;
        if (language === ENGLISH)
            order_of_headers = [this.props.english_name, this.props.chinese_name,
                this.props.pinyin_name];
        else
            order_of_headers = [this.props.chinese_name, this.props.english_name];

        var i = 0;
        var Header_Tag = this.props.header_tag;
        var header_class_string = this.props.header_class_string ? this.props.header_class_string : "";
        for (; i < order_of_headers.length; i++) {
            var header = order_of_headers[i];
            if (header) {
                stuff_to_add.push(React.createElement(Header_Tag, {class_name: header_class_string}, header));
                i++;
                break;
            }
        }

        var sub_headers = [];
        for (; i < order_of_headers.length; i++) {
            var sub_header = order_of_headers[i];
            if (sub_header) sub_headers.push(sub_header);
        }

        if (sub_headers.length > 0) {
            var Sub_Header_Tag = this.props.sub_header_tag;
            var sub_header_class_string = this.props.sub_header_class_string ? this.props.sub_header_class_string : "";
            if (sub_headers.length > 1) sub_headers = sub_headers.join(" ");
            else sub_headers = sub_headers[0];
            stuff_to_add.push(React.createElement(Sub_Header_Tag, {className: sub_header_class_string}, sub_headers));
        }

        var class_string = this.props.class_string ? this.props.class_string : "";
        return (
            React.createElement("div", {className: class_string}, 
                stuff_to_add
            )
        );
    }
});


// TODO: Deal with dead code in Adoptee (there's a lot around photo, which never happens)
var Adoptee = React.createClass({displayName: "Adoptee",
    render: function () {
        var Primary_Name_Tag;
        var Secondary_Name_Tag;

        if (this.props.photo) { // we render very differently with photo
            var class_string = this.props.class_string ? this.props.class_string : "adopteeListingName";
            Primary_Name_Tag = this.props.primary_name_tag ? this.props.primary_name_tag : "h3";
            Secondary_Name_Tag = this.props.secondary_name_tag ? this.props.secondary_name_tag : "h4";

            return (
                React.createElement("div", {className: class_string}, 
                    React.createElement(NameHeader, {english_name: this.props.english_name, 
                                chinese_name: this.props.chinese_name, 
                                pinyin_name: this.props.pinyin_name, 
                                header_tag: Primary_Name_Tag, 
                                sub_header_tag: Secondary_Name_Tag}), 

                    React.createElement("div", null, 
                        React.createElement("img", {src: this.props.photo})
                    )
                )
            );
        } else {
            Primary_Name_Tag = this.props.primary_name_tag ? this.props.primary_name_tag : "h2";
            Secondary_Name_Tag = this.props.secondary_name_tag ? this.props.secondary_name_tag : "h3";

            return (
                React.createElement("div", {className: "adopteeName"}, 
                    React.createElement(NameHeader, {english_name:'The Story of '+ this.props.english_name, 
                                chinese_name: this.props.chinese_name, 
                                pinyin_name: this.props.pinyin_name, 
                                header_tag: Primary_Name_Tag, 
                                sub_header_tag: Secondary_Name_Tag})
                )
            );
        }
    }
});

var RelationshipHeader = React.createClass({displayName: "RelationshipHeader",
    render: function () {
        var header_order; // preferred header from most to least preferred
        if (language === ENGLISH) header_order = [this.props.english_name,
            this.props.chinese_name];
        else                      header_order = [this.props.chinese_name,
            this.props.english_name];

        var header_text = firstNonNullOrDefault(header_order, "");

        return (
            React.createElement("div", {className: "relationshipHeader"}, React.createElement("h4", null, header_text))
        );
    }
});

var getCaption = function (media_item) {
    var caption_preference = language === ENGLISH ? [media_item.english_caption, media_item.chinese_caption]
        : [media_item.chinese_caption, media_item.english_caption];
    return firstNonNullOrDefault(caption_preference, "");
};

var Media = React.createClass({displayName: "Media",
    getInitialState: function () {
        return {
            embed_shizzle: {__html: ""}, isInnerHTML: true,
            caption: "", style_overrides: null, class_name: ""
        };
    },
    componentDidMount: function () {
        if (this.props.media.audio.length > 0) {
            var audio = this.props.media.audio[0];
            var audio_url = audio.audio;
            $.ajax({
                url: "http://soundcloud.com/oembed",
                dataType: "json",
                data: {
                    format: "json",
                    url: audio_url,
                    maxheight: 81
                },
                success: function (data) {
                    this.setState({
                        embed_shizzle: {
                            __html: data.html
                        },
                        isInnerHTML: true,
                        caption: getCaption(audio),
                        style_overrides: null,
                        class_name: "audio"
                    });
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error(audio_url, status, err.toString());
                }.bind(this)
            });
        } else if (this.props.media.video.length > 0) {
            var video = this.props.media.video[0];
            var video_iframe_url = video.iframe_url;
            var embed_code = React.createElement("iframe", {width: "100%", height: "315", src: video_iframe_url, frameborder: "0", 
                                     allowfullscreen: true});
            this.setState({
                embed_shizzle: embed_code,
                isInnerHTML: false,
                caption: getCaption(video),
                style_overrides: null,
                class_name: "video"
            });
        }
    },
    render: function () {
        var content;
        var class_name = this.state.class_name;
        if (this.state.isInnerHTML)
            content =
                React.createElement("div", {className: class_name}, 
                    React.createElement("div", {className: "media-embed", 
                         dangerouslySetInnerHTML: this.state.embed_shizzle}), 
                    React.createElement("div", {className: "media-caption"}, 
                        React.createElement("p", null, 
                            this.state.caption
                        )
                    )
                );
        else
            content =
                React.createElement("div", {className: class_name}, 
                    React.createElement("div", {className: "media-embed"}, 
                        this.state.embed_shizzle
                    ), 
                    React.createElement("div", {className: "media-caption"}, 
                        React.createElement("p", null, 
                            this.state.caption
                        )
                    )
                );

        return this.state.style_overrides ?
            React.createElement("div", {className: "media-container", style: this.state.style_overrides}, content)
            : React.createElement("div", {className: "media-container"}, content)
    }
});

var processTextStory = function (story_text) {
    story_text = story_text.split(/<p>|<\/p>/);
    for (var i = 1; i < story_text.length; i += 2) {
        if(i == 1 || i == 2) {
            story_text[i] = React.createElement("p", null, story_text[i]);
        } else {
            if(story_text[i] != '') {
                story_text[i] = React.createElement("span", null, story_text[i]);
            }
        }
    }
    return story_text
};

var processText = function (story_text) {
    story_text = story_text.split(/<p>|<\/p>/);
    for (var i = 1; i < story_text.length; i += 2) {
        story_text[i] = React.createElement("p", null, story_text[i])
    }
    return story_text
};

var processTextTerm = function () {
    return (
       
        React.createElement("div", {className: "col-md-12 pricevy"}, 
            React.createElement("p", {className: "bold center bottomo"}, "OURCHINASTORIES.COM"),
            React.createElement("p", {className: "bold center"}, "TERMS OF USE"),
            React.createElement("p", {className: "eeomo"}, 'IMPORTANT – READ CAREFULLY. THESE TERMS OF USE SET FORTH THE LEGAL AGREEMENT BETWEEN YOU AND OURCHINASTORIES.COM ("WE", "US" OR SIMILAR TERMS) RELATING TO YOUR ACCESS TO AND USE OF THE SITE AND OUR OTHER SERVICES.'),
            React.createElement("ol", {className: "first-number"}, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Acceptance of the Terms of Use"),
                    React.createElement("div", {className: "title-under"}, 
                        React.createElement("span", {className: "botbold"}, 'The following terms and conditions (collectively, these "'),
                        React.createElement("span", {className: "bold"}, 'Terms of Use'),
                        React.createElement("span", {className: "botbold"}, ') govern your access to and use of our website, www.ourchinastories.com (the "'),
                        React.createElement("span", {className: "bold"}, 'Site'),
                        React.createElement("span", {className: "notbold"}, '"), and any features, functionality, information or services (including content and material) made available by or on behalf of us through the Site (collectively, the “'),
                        React.createElement("span", {className: "bold"}, 'Services'),
                        React.createElement("span", {className: "notbold"}, '”).')
                    ),
                    React.createElement("div", {className: "title-under"}, 
                        React.createElement("span", {className: "botbold"}, 'Please read these Terms of Use carefully before you start to use the Services. '),
                        React.createElement("span", {className: "bold"}, 'By using any of the Services, or by clicking to accept or agree to the Terms of Use when and if this option is made available to you, you accept and agree to be bound and abide by these Terms of Use, and our Privacy Policy which is incorporated herein by reference. '),
                        React.createElement("span", {className: "botbold"}, 'If you do not want to agree to these Terms of Use or the Privacy Policy, you must not access or use the Site or any other Services.')
                        
                    ),
                    React.createElement("div", {className: "title-under"}, "By using the Services, you represent and warrant that you are of legal age to form a binding contract with us, have read these Terms of Use and agree to be legally bound by these Terms of Use. If you do not meet all of these requirements, you must not access or use any of the Services.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 2 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Accessing the Services; Account Security"),
                    React.createElement("div", {className: "title-under"}, 'We reserve the right to withdraw or amend the Services or any portion thereof at any time, in our sole discretion without notice. We will not be liable if for any reason all or any part of the Services are unavailable at any time or for any period. From time to time, we may restrict access to some parts of the Services to users. You are responsible for making all arrangements necessary for you to have access to the Services.'),
                    React.createElement("div", {className: "title-under"}, 'To access the Services or some of the resources it offers, you may be asked to provide certain registration details or other information. It is a condition of your use of the Services that all such information you provide to us through the Services is correct, current and complete, and you further agree to update such information so that it remains correct, current and complete. You further agree that all information you provide to us through the Services (including any registration and account information) is governed by our Privacy Policy, and you consent to all actions we take with respect to your information consistent with our Privacy Policy.'),
                    React.createElement("div", {className: "title-under"}, 'If you choose, or are provided with, a username, password or any other piece of information as part of our security procedures, you must treat such information as confidential, and you must not disclose it to any other person or entity. You agree not to provide any other person with access to the Services or portions thereof using any such user name, password or other security information chosen or provided to you. You agree to notify us immediately of any unauthorized access to or use of your user name or password or any other breach of security.'),        
                    React.createElement("div", {className: "title-under"}, 
                        React.createElement("span", {className: "botbold"}, 'We have the right to disable any username, password or other identifier, whether chosen by you or provided by us, at any time in our sole discretion for any or no reason, including if, in our opinion, you have violated any provision of these Terms of Use.')
                    )
                    
                    
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 3 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Intellectual Property Rights"),
                    React.createElement("div", {className: "normal"}, 'The Services and the contents, features and functionality of the Site are owned by us, and are protected by United States and international copyright, trademark, patent, trade secret and other intellectual property or proprietary rights laws. Any content, suggestions, feedback or other information provided by you relating the Services or the Site is provided to us on a non- confidential and unrestricted basis, and you hereby grant to us a non-exclusive, worldwide, perpetual, royalty-free, fully transferable and sublicenseable (through multiple tiers) right and license to reproduce, display, distribute, use and fully exploit such suggestions, feedback and information.'),
                    React.createElement("div", {className: "normal title-under"}, "These Terms of Use permit you to use the Services for your personal, non-commercial use only. You must not reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store or transmit any of the content or material available on the Services, except as follows: (a) your computer may temporarily store copies of such materials in RAM incidental to your accessing and viewing those materials; (b) you may store files that are automatically cached by your web browser for display enhancement purposes; (c) you may print a reasonable number of pages of the Site for your own personal, non-commercial use and not for further reproduction, publication or distribution; and (d) if we provide Interactive Services (as defined in Section 6 of these Terms of Use) as part of the Services, you may take such actions as are enabled by such features and functionality."),
                    React.createElement("div", {className: "normal title-under"}, "You must not modify copies of any materials obtained from the Services, or delete or alter any copyright, trademark or other proprietary rights notices from copies of materials available through the Services. You must not access or use for any commercial purposes any part of the Services or materials available on or through the Services."),
                    React.createElement("div", {className: "normal title-under"}, "No right, title or interest in or to Services or any content available through the Services is transferred to you, and all rights not expressly granted are reserved by us. Any use of the  Services not expressly permitted by these Terms of Use is a breach of these Terms of Use and may violate copyright, trademark and other laws.")
                    
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 4 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Prohibited Uses"),
                    React.createElement("div", {className: "normal"}, 'You may use the Services only for lawful purposes and in accordance with these Terms of Use. You agree not to: (a) use the Services in any way that violates any applicable federal, state, local or international law or regulation (including any laws regarding the export of data or software to and from the United States of America or other countries); (b) use the Services for the purpose of exploiting, harming or attempting to exploit or harm minors in any way by exposing them to inappropriate content, asking for personally identifiable information or otherwise; (c) use the Services to send, knowingly receive, upload, download, use or re-use any  material which does not comply with the Content Standards (see Section 7 of these Terms of Use); (d) use the Services to transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter" or "spam" or any other similar solicitation; (e) use the Services to impersonate or attempt to impersonate us, another user or any other person or entity (including by using e-mail addresses associated with any of the foregoing); (f) use the Services to engage in any other conduct that restricts or inhibits anyone\'s use or enjoyment of the Services, or which, as determined by us, may harm us or users of the Services or expose them to liability; (g) use the Services in any manner that could disable, overburden, damage, or impair the Site or interfere with any other party\'s use of the Services, including their ability to engage in real time activities through the Services; (h) use any robot, spider or other automatic device, process or means to access the Services for any purpose, including accessing, monitoring, copying, transmitting or otherwise using any of the content on the Services; (i) use any manual process or means to access, monitor, copy, transmit or otherwise use the Services (including any content or material) for any unauthorized purpose; (j) use any device, software or routine that interferes with the proper working of the; (k) introduce any viruses, trojan horses, worms, logic bombs or other materials which are malicious or technologically harmful; (l) attempt to gain unauthorized access to, interfere with, damage or disrupt any parts of the Services, or any server, computer or database connected to, or used by us to provide, the Services; (m) reverse engineer, decompile, disassemble, decode or otherwise attempt to discover the source code, algorithms, architecture, structure or underlying technology of the Services; (n) use the Services for competitive or benchmarking analysis or for development of a competing product, service or offering; (o) attack the Services via a denial-of-service attack or a distributed denial-of-service attack; or (p) otherwise attempt to interfere with the proper working of the Services. You further agree not to engage or assist any person to take any action that would violate these Terms of Use.')
                    
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 5 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "User Contributions"),
                    React.createElement("div", {className: "title-under"}, 
                        React.createElement("span", {className: "botbold"}, 'The Services may contain message boards, commenting features, chat rooms, personal web pages or profiles, forums, bulletin boards, messaging functions and other interactive features (collectively, "'),
                        React.createElement("span", {className: "bold"}, 'Interactive Services'),
                        React.createElement("span", {className: "botbold"}, '") that allow users to post, submit, publish, display or transmit to other users or other persons (hereinafter, "'),
                        React.createElement("span", {className: "bold"}, 'post'),
                        React.createElement("span", {className: "notbold"}, '") content or materials (collectively, "'),
                        React.createElement("span", {className: "bold"}, 'User Contributions'),
                        React.createElement("span", {className: "notbold"}, '") on or through the Services. All User Contributions must comply with the Content Standards (see Section 7 of these Terms of Use).')
                    ),
                    React.createElement("div", {className: "normal"}, 'Any User Contribution you post to the Services will be considered non-confidential. By providing any User Contribution on the Services, you grant to us a non-exclusive, worldwide, irrevocable, perpetual right, royalty-free, fully transferable and sublicenseable (through multiple tiers) license to reproduce, display, distribute, modify, prepare derivative works of, and otherwise use the User Contribution. You represent and warrant that: (a) you own or control all rights in and to the User Contributions and have the right to grant the license granted above to us and (b) all of your User Contributions do and will comply with these Terms of Use. You understand and acknowledge that you are responsible for any User Contributions you submit or contribute, and you, not us, have full responsibility for such content, including its legality, reliability, accuracy and appropriateness. We are not responsible, or liable to any third party, for the content or accuracy   of any User Contributions posted by you or any other user of the Services.')
                    
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 6 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Monitoring and Enforcement; Termination"),
                    React.createElement("div", {className: "normal"}, "We have the right to: (a) remove or refuse to post any User Contributions for any or no reason in our sole discretion; (b) take any action with respect to any User Contribution that we deem necessary or appropriate in our sole discretion, including if we believe that such User Contribution violates the Terms of Use, including the Content Standards (see Section 7 of these Terms of Use), infringes any intellectual property right or other right of any person or entity, threatens the personal safety of users of the Services or the public or could create liability for  us;(c) disclose your identity or other information about you to any third party who claims that material posted by you violates their rights, including their intellectual property rights or their right to privacy; (d) take appropriate legal action, including referral to law enforcement, for any illegal or unauthorized use of the Services; and (e) terminate or suspend your access to all or part of the Services for any or no reason, including any violation of these Terms of Use."),
                    React.createElement("div", {className: "normal title-under"}, "Without limiting the foregoing, we have the right to fully cooperate with any law enforcement authorities or court order requesting or directing us to disclose the identity or other information of anyone posting any materials on or through the Services. YOU WAIVE AND HOLD HARMLESS US AND OUR AFFILIATES, LICENSEES AND SERVICE PROVIDERS FROM ANY CLAIMS RESULTING FROM ANY ACTION TAKEN BY ANY OF THE FOREGOING PARTIES DURING OR AS A RESULT OF ITS INVESTIGATIONS AND FROM ANY ACTIONS TAKEN AS A	CONSEQUENCE	OF INVESTIGATIONS BY EITHER	SUCH PARTIES OR	LAW ENFORCEMENT AUTHORITIES."),
                    React.createElement("div", {className: "normal title-under"}, "Although we have the right to review all User Contributions and to decide, in our sole discretion, whether those User Contributions will be posted on the site, we may not always undertake to review material before it is posted, and cannot ensure prompt removal of objectionable material after it has been posted. Accordingly, we assume no liability for any action or inaction regarding transmissions, communications or content provided by any user or third party. We have no liability or responsibility to anyone for performance or nonperformance of the activities described in this section.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 7 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Content Standards"),
                    React.createElement("div", {className: "normal"}, 'These content standards apply to any and all User Contributions and use of Interactive Services. User Contributions must in their entirety comply with all applicable federal, state, local and international laws and regulations. Without limiting the foregoing, User Contributions must not: (a) contain any material which is defamatory, obscene, indecent, abusive, offensive, harassing, violent, hateful, inflammatory, harmful to minors or otherwise objectionable; (b) promote sexually explicit or pornographic material, violence, or discrimination based on race, sex, religion, nationality, disability, sexual orientation or age; (c) infringe any patent, trademark, trade secret, copyright or other intellectual property or other rights of any other person; (d) violate the legal rights (including the rights of publicity and privacy) of others or contain any material that could give rise to any civil or criminal liability under applicable laws or regulations or  that otherwise may be in conflict with these Terms of Use or our Privacy Policy; (e) be likely to  deceive any person; (f) promote any illegal activity, or advocate, promote or assist any unlawful act; (g) cause annoyance, inconvenience or needless anxiety or be likely to upset, embarrass, alarm or annoy any other person; (h) impersonate any person, or misrepresent your identity or affiliation with any person or organization; or (i) give the impression that they emanate from or are endorsed by us or any other person or entity, if this is not the case.')
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 8 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Copyright Infringement"),
                    React.createElement("div", {className: "title-under"}, 
                        React.createElement("span", {className: "botbold"}, 'We take claims of copyright infringement seriously. We will respond to notices of alleged copyright infringement that comply with applicable law. If you believe that any User Contributions violate your copyright, you may request removal of those materials (or access thereto) from the Services by submitting written notification to our DMCA Agent (designated below). In accordance with the Online Copyright Infringement Liability Limitation Act of the Digital Millennium Copyright Act (17 U.S.C. § 512) ("'),
                        React.createElement("span", {className: "bold"}, 'DMCA'),
                        React.createElement("span", {className: "botbold"}, '"), the written notice (the "'),
                        React.createElement("span", {className: "bold"}, 'DMCA Notice'),
                        React.createElement("span", {className: "notbold"}, '") must include substantially the following: (i) your physical or electronic signature; (ii) identification of the copyrighted work you believe to have been infringed or, if the claim involves multiple works on the Services, a representative list of such works; (iii) identification of the material you believe to be infringing in a sufficiently precise manner to allow us to locate that material; (iv) adequate information by which we can contact you (including your name, postal address, telephone number and, if available, e-mail address); (v) a statement that you have a good faith belief that use of the copyrighted material is not authorized by the copyright owner, its agent or the law; (vi)  a statement that the information in the written notice is accurate; and (vii) a statement, under penalty of perjury, that you are authorized to act on behalf of the copyright owner. If you fail to comply with all of the requirements of Section 512(c)(3) of the DMCA, your DMCA Notice may not be effective. Please be aware that if you knowingly materially misrepresent that material or activity on the Services is infringing your copyright, you may be held liable for damages (including costs and attorneys\' fees) under Section 512(f) of the DMCA. It is our policy, in appropriate circumstances, to disable and/or terminate the accounts of users who are repeat infringers. You may send DMCA Notices to our designated DMCA Agent: by mail, at 6514 Santolina Cove, Austin, Texas 78731, Attn: DMCA Agent; or, by email, at jenaheath@gmail.com.')
                        
                    )
                   
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 9 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Reliance on Information"),
                    React.createElement("div", {className: "normal"}, "The information available on or through the Services is made available solely for general information purposes, and, in particular, is not intended to be a substitute for any professional advice."),
                    React.createElement("div", {className: "normal title-under"}, "We may update the information available on or through the Services from time to time, but its content is not necessarily complete or up-to-date. Any of the information available on or through the Services may be out of date at any given time, and we are under no obligation to update such information."),
                    React.createElement("div", {className: "normal title-under"}, "ACCORDINGLY, YOU FURTHER ACKNOWLEDGE AND AGREE THAT: (A) ALL INFORMATION PRESENTED ON OR THROUGH THE SERVICES IS PROVIDED ON “AS IS” BASIS WITH “ALL FAULTS”; (B) WE DO NOT MAKE, AND HEREBY EXPRESSLY DISCLAIM, ANY AND ALL REPRESENTATIONS AND WARRANTIES, WHETHER EXPRESS OR IMPLIED, WITH RESPECT TO (I) THE ACCURACY, COMPLETENESS, RELIABILITY, EFFECTIVENESS, USE, OR RESULTS OF USE OF ANY INFORMATION PRESENTED ON OR THROUGH THE SERVICES, OR (II) THE BUSINESS, PRODUCTS, SERVICES, OR OTHER OFFERINGS OF ANY PERSON, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE, OR ANY WARRANTIES OF TITLE OR NON- INFRINGEMENT; AND (C) ANY RELIANCE ON OR USE OF ANY INFORMATION PRESENTED ON OR THROUGH THE SERVICES BY YOU IS DONE SO AT YOUR OWN RISK.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 10 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Links to and from the Services and Social Media Features"),
                    React.createElement("div", {className: "normal"}, "You may link to our homepage, provided you do so in a way that is fair and legal and does not damage our reputation or take advantage of it, but you must not establish a link in such  a way as to suggest any form of association, approval or endorsement on our part without our express written consent."),
                    React.createElement("div", {className: "normal"}, "The Services may enable you to utilize certain social media features that allow you to: (a) link from your own or certain third-party websites to certain content on the Site; (b) send communications with certain content or links to certain content; (c) cause limited portions of content on the Site to be displayed or appear to be displayed on your own or certain third-party websites. You may use these features solely as they are offered. You understand and agree that by activating such social media features, certain information may be shared between the Services and the applicable social media site you have selected. You agree to cooperate with us in  causing any unauthorized framing or linking immediately to cease. We reserve the right to withdraw linking permission without notice. We may disable all or any social media features and any links at any time without notice in our discretion."),
                    React.createElement("div", {className: "title-under"}, 
                        React.createElement("span", {className: "botbold"}, 'The Services may contain links to or interactivity with other sites, resources and information (including advertisements, banner ads, sponsored links and social media features) provided by third parties (collectively, “'),
                        React.createElement("span", {className: "bold"}, 'Third Party Sites'),
                        React.createElement("span", {className: "botbold"}, '”). Links to or interactivity with these Third Party Sites are provided solely as a convenience to you, and the Third Party Sites are not a part of the Services. We do not operate, own or control the Third Party Sites and accept no responsibility for them or for any loss or damage that may arise from your use of them. You acknowledge and agree that your access to and use of the Third Party Sites is subject solely to the applicable terms and conditions of use (including privacy policies), if any, of the Third Party Sites. These Terms of Use (including our Privacy Policy) do not apply to any access to or use of any Third Party Sites by you. If you decide to access or use any Third Party Sites, you do so entirely at your own risk.')
                        
                        
                    ),
                    React.createElement("div", {className: "normal"}, "YOU FURTHER ACKNOWLEDGE AND AGREE THAT: (A) WE ARE NOT RESPONSIBLE FOR (I) ANY THIRD PARTY SITES (INCLUDING ANY INFORMATION PRESENTED, OR TRANSACTIONS CONDUCTED, ON OR THROUGH SUCH SITES), (II) YOUR ACCESS TO OR USE OF ANY THIRD PARTY SITES (INCLUDING ANY TRANSACTIONS YOU CONDUCT ON, THROUGH, OR AS A RESULT OF THEREOF), (III) ANY PRODUCTS, SERVICES OR OTHER OFFERINGS OFFERED OR PROVIDED BY SUCH THIRD PARTY SITE, OR (IV) ANY LOSS OR DAMAGE THAT MAY ARISE FROM ANY OF THE FOREGOING; (B) WE DO NOT MAKE, AND HEREBY EXPRESSLY DISCLAIM, ANY AND ALL REPRESENTATIONS OR WARRANTIES, WHETHER EXPRESS OR IMPLIED, WITH RESPECT TO (I) ANY THIRD PARTY SITES (INCLUDING ANY INFORMATION PRESENTED, OR TRANSACTIONS CONDUCTED, ON OR THROUGH SUCH SITES), (II) YOUR ACCESS TO OR USE OF ANY THIRD PARTY SITES (INCLUDING ANY TRANSACTIONS YOU CONDUCT ON, THROUGH, OR AS A RESULT OF THEREOF). OR (III) ANY PRODUCTS, SERVICES OR OTHER OFFERINGS OFFERED OR PROVIDED BY ANY SUCH THIRD PARTY SITE, INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE, OR ANY WARRANTIES OF TITLE OR NON-INFRINGEMENT; AND (C) YOUR USE OF ANY THIRD PARTY SITE IS AT YOUR OWN RISK.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 11 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Information About You and Your Visits to the Services"),
                    React.createElement("div", {className: "normal"}, "All information we collect in connection with your access to and use of the Services is subject to our Privacy Policy. By accessing or using the Services, you consent to all actions taken by us with respect to your information in compliance with the Privacy Policy.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 12 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Geographic Restrictions"),
                    React.createElement("div", {className: "normal"}, "We (directly or through our third party service providers) host the Site and other online portions of the Services in the United States of America, and the Services are intended for use  by, and directed to, users located in the United States of America. We make no claims that the Services or any of its content is accessible or appropriate outside of the United States of America. Access to and use of the Services may not be legal by certain persons or in certain countries. If you are a consumer accessing the Services from the European Union or other region with laws or regulations governing personal data collection, use and disclosure that differ from the laws of the United States of America, please be advised that (i) you do so on your own initiative and are responsible for compliance with local laws and (ii) you are transferring your personally identifiable information to the United States of America and you consent to that transfer.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 13 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Disclaimer of Warranties"),
                    React.createElement("div", {className: "normal"}, "You understand that we cannot and do not guarantee or warrant that files available for downloading from the intrnet or the Site will be free of viruses or other destructive code. You are responsible for implementing sufficient procedures and checkpoints to satisfy your particular requirements for anti-virus protection and accuracy of data input and output, and for maintaining a means external to our site for any reconstruction of any lost data. WE WILL NOT BE LIABLE FOR ANY LOSS OR DAMAGE CAUSED BY A DISTRIBUTED DENIAL-OF-SERVICE ATTACK, VIRUSES OR OTHER TECHNOLOGICALLY HARMFUL MATERIAL THAT MAY INFECT YOUR COMPUTER EQUIPMENT, COMPUTER PROGRAMS, DATA OR OTHER PROPRIETARY MATERIAL DUE TO YOUR USE OF THE SERVICES OR ITEMS OBTAINED THROUGH THE SERVICES OR TO YOUR DOWNLOADING OF ANY MATERIAL POSTED ON IT, OR ON ANY WEBSITE LINKED TO IT."),
                    React.createElement("div", {className: "normal title-under"}, 'YOU ACKNOWLEDGE AND AGREE THAT THE SERVICES ARE PROVIDED ON AN “AS IS, AS AVAILABLE” BASIS. ANYTHING TO THE CONTRARY NOTWITHSTANDING, WE (INCLUDING, FOR PURPOSES OF THIS SECTION, OUR AFFILIATES AND LICENSORS) DO NOT MAKE ANY, AND HEREBY EXPRESSLY DISCLAIM ALL, WARRANTIES, WHETHER EXPRESSED OR IMPLIED, WITH RESPECT TO THE SERVICES AND ANY OTHER PRODUCTS, SERVICES, OFFERINGS, INFORMATION OR ITEMS MADE AVAILABLE BY OR THROUGH THE USE OF THE SERVICES (COLLECTIVELY, THE “OFFERINGS”), INCLUDING ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE OR NON-INFRINGEMENT OR ANY OTHER WARRANTIES THAT MAY ARISE  FROM  USAGE  OF  TRADE  OR  COURSE  OF  DEALING.   WITHOUT  LIMITING THE FOREGOING, WE DO NOT MAKE ANY, AND HEREBY EXPRESSLY DISCLAIM ALL, REPRESENTATIONS, WARRANTIES AND/OR GUARANTEES REGARDING (I) THE OFFERINGS (INCLUDING THE USE OF OR THE RESULTS OF THE OFFERINGS) IN TERMS OF CORRECTNESS, ACCURACY, RELIABILITY, TIMELINESS, AVAILABILITY, SECURITY, COMPLIANCE WITH APPLICABLE LAWS OR OTHERWISE, OR (II) WHETHER THE OPERATION OF THE OFFERINGS WILL BE UNINTERRUPTED OR ERROR FREE. YOUR USE OF THE OFFERINGS IS DONE SO AT YOUR OWN RISK. THE FOREGOING DOES NOT AFFECT ANY LIABILITY WHICH CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW. ANYTHING TO THE CONTRARY NOTWITHSTANDING, YOU ACKNOWLEDGE AND AGREE THAT WE HAVE THE RIGHT TO MODIFY, SUSPEND, OR DISCONTINUE THE SERVICES ANY TIME WITHOUT NOTICE OR LIABILITY TO YOU.')
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 14 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Limitation on Liability"),
                    React.createElement("div", {className: "normal"}, "IN NO EVENT WILL WE (INCLUDING, FOR PURPOSES OF THIS SECTION, OUR AFFILIATES AND LICENSORS) BE LIABLE TO YOU OR ANY OTHER PERSON FOR ANY INDIRECT, CONSEQUENTIAL, INCIDENTAL, SPECIAL OR PUNITIVE DAMAGES (INCLUDING LOSS OF REVENUE OR PROFIT, LOSS OF DATA, OR LOSS OF TIME OR BUSINESS) ARISING OUT OF OR RELATING TO THESE TERMS OF USE AND/OR THE SERVICES, WHETHER LIABILITY IS ASSERTED IN CONTRACT OR IN TORT (INCLUDING STRICT LIABILITY OR NEGLIGENCE) OR OTHERWISE, AND REGARDLESS OF WHETHER WE  HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. ANYTHING TO THE CONTRARY NOTWITHSTANDING, OUR TOTAL MAXIMUM LIABILITY FOR ANY AND ALL CLAIMS, DAMAGES AND LIABILITIES ARISING OUT OF OR RELATING TO THESE TERMS OF USE AND/OR THE SERVICES, WHETHER LIABILITY IS ASSERTED IN CONTRACT OR IN TORT (INCLUDING STRICT LIABILITY OR NEGLIGENCE) OR OTHERWISE, WILL IN NO EVENT EXCEED THE GREATER OF (I) THE TOTAL AMOUNT OF FEES, IF ANY, PAID TO US BY YOU FOR THE RIGHT TO ACCESS AND USE THE SERVICES DURING THE 12-MONTH PERIOD PRIOR TO THE OCCURRENCE OF SUCH CLAIM, DAMAGE OR LIABILITY, LESS THE AMOUNT OF ALL CLAIMS, DAMAGES OR LIABILITIES PREVIOUSLY PAID BY US DURING SUCH 12-MONTH PERIOD AND (II) US$100. NO ACTION, SUIT OR PROCEEDING AGAINST US MAY BE BROUGHT MORE THAN ONE YEAR FOLLOWING THE DATE UPON WHICH THE CLAIM FIRST AROSE. THE FOREGOING DOES NOT AFFECT ANY LIABILITY WHICH CANNOT BE EXCLUDED OR LIMITED UNDER APPLICABLE LAW.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 15 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Indemnification"),
                    React.createElement("div", {className: "normal"}, "You agree to defend, indemnify and hold harmless us, our affiliates, licensors and service providers, and our and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms of Use and/or your access to or use of the Services, including your User Contributions, any use of the Services other than as expressly authorized in these Terms of Use or your use of any information obtained from the Services.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 16 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Governing Law"),
                    React.createElement("div", {className: "normal"}, "ALL MATTERS RELATING TO THE SERVICES AND THESE TERMS OF USE AND ANY DISPUTE OR CLAIM ARISING THEREFROM OR RELATED THERETO (IN EACH CASE, INCLUDING NON-CONTRACTUAL DISPUTES OR CLAIMS) WILL BE GOVERNED BY AND CONSTRUED IN ACCORDANCE WITH THE INTERNAL LAWS OF THE STATE OF TEXAS, WITHOUT GIVING EFFECT TO ANY CHOICE OF LAW PROVISION OR RULE (WHETHER OF THE STATE OF TEXAS OR OTHERWISE). ANY LEGAL SUIT, ACTION OR PROCEEDING ARISING OUT OF OR RELATED TO THIS AGREEMENT OR THE SERVICES SHALL BE INSTITUTED EXCLUSIVELY IN THE FEDERAL COURTS OF THE UNITED STATES OR THE COURTS OF THE STATE OF TEXAS, IN EACH CASE, LOCATED IN AUSTIN, TEXAS, U.S.A. YOU WAIVE ANY AND ALL OBJECTIONS TO THE EXERCISE OF JURISDICTION OVER YOU BY SUCH COURTS AND TO VENUE IN SUCH COURTS.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 17 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Waiver and Severability; Interpretations"),
                    React.createElement("div", {className: "normal"}, "No waiver by us of any term or condition set forth in these Terms of Use shall be deemed a further or continuing waiver of such term or condition or a waiver of any other term or condition, and any failure of us to assert a right or provision under these Terms of Use shall not constitute a waiver of such right or provision."),
                    React.createElement("div", {className: "normal"}, "If any provision of these Terms of Use is held by a court or other tribunal of competent jurisdiction to be invalid, illegal or unenforceable for any reason, such provision shall be eliminated or limited to the minimum extent such that the remaining provisions of the Terms of Use will continue in full force and effect."),
                    React.createElement("div", {className: "normal"}, 'Each instance in these Terms of Use of the words "include," "includes," and "including" will be deemed to be followed by the words "without limitation." As used in these Terms of Use, the term "days" means calendar days, not business days, unless otherwise specified. All headings or section divisions contained in these Terms of Use are for reference purposes only and will not be construed to affect the meaning or interpretation of these Terms of Use.')
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 18 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Changes to the Terms of Use"),
                    React.createElement("div", {className: "normal"}, "We may revise and update these Terms of Use from time to time in our sole discretion. All changes are effective immediately when we post them, and apply to all access to and use of the Services thereafter. Your continued use of any Services following the posting of revised Terms of Use means that you accept and agree to the change, so please check this page periodically for updates.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 19 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Entire Agreement"),
                    React.createElement("div", {className: "normal"}, "These Terms of Use, including our Privacy Policy, constitute the sole and entire agreement between you and us with respect to the Services and supersede all prior and contemporaneous understandings, agreements, representations and warranties, both written and oral, with respect to the Services")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 20 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Contact Us"),
                    React.createElement("div", {className: "normal"}, "If you have any feedback, comments or questions regarding our Site or other Services, you may contact us at jenaheath@gmail.com.")
                )
            )
            
        )
    
    );
};

var processTextPrivacy = function () {
    return (
       
        React.createElement("div", {className: "col-md-12 pricevy"}, 
            React.createElement("p", {className: "bold center bottomo"}, "OURCHINASTORIES.COM"),
            React.createElement("p", {className: "bold center"}, "PRIVACY POLICY"),
            React.createElement("p", {className: "eeomo"}, 'Ourchinastories.com("we", “us” or similar terms) respects your privacy and is committed to protecting it through our compliance with this Privacy Policy.'),
            React.createElement("ol", {className: "first-number"}, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "How This Privacy Policy Applies"),
                    React.createElement("div", {className: "title-under"}, 'This Privacy Policy describes the types of information we may collect from you, or that you may provide, in connection with your access to or use of (i) our website www.ourchinastories.com  (the "Site"), and any features, functionality, information or services (including content and material) made available by or on behalf of us through the Site (collectively, the “Services”). '),
                    React.createElement("div", {className: "title-under"}, "The Services may include links to third party websites and/or services.  This Privacy Policy does not apply to information collected by or through any such third party websites or services, and the collection and use of your information by such third party websites and services are governed by the privacy policies, if any, of such third parties."),
                    React.createElement("div", {className: "title-under"}, "Please read this Privacy Policy carefully to understand our policies and practices regarding your information and how we will treat it. If you do not agree with our policies and practices, your choice is not to use the Services.  By accessing or using the Services, you agree to this Privacy Policy. This Privacy Policy may change from time to time (see Section 9 (Changes to our Privacy Policy)).")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 2 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Information We Collect About You and How We Collect It"),
                    React.createElement("div", {className: "title-under"}, 'We may collect several types of information from and about users of the Services, including information:'),
                    React.createElement("ul", {className: "second-number"}, 
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'By which you may be personally identified, such as name, postal address, e-mail address or any other information that is defined as personal or personally identifiable information under applicable law ("'),
                             React.createElement("span", {className: "bold"}, 'personal information'),
                             React.createElement("span", {className: "botbold"}, '");')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'That is about you but individually does not identify you, such as your interactions with the Services; and/or')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'About your internet connection, the equipment you use to access the Services, and usage details.')
                        )
                    ),
                    React.createElement("div", {className: "title-under"}, 'We may collect this information:'),
                    React.createElement("ul", {className: "second-number"}, 
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'Directly from you when you provide it to us.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'Automatically as you interact with or otherwise use the Services (including usage details, IP addresses and information collected through cookies and other tracking technologies).')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'From third parties, for example, (i) our service providers that furnish us with analytical information on users of the Services and (iii) any social networking sites or services (such as Facebook, Twitter, and other social media providers) through which you may be permitted to register or interact with the Services.')
                        )
                    ),
                    React.createElement("div", {className: "title-under"}, 'a. Information You Provide to Us. The information we collect on or through the Services may include:'),
                    React.createElement("ul", {className: "second-number"}, 
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'Information that you provide by filling in forms on our Site, for example, when you register for (or update) your user account, or request further information or services through a contact form.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'Records and copies of your email, text and electronic communications, if you contact us.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'Your search queries on the Site.')
                        )
                    ),
                    React.createElement("div", {className: "title-under"}, 
                        React.createElement("span", {className: "botbold"}, 'Please note that any content, suggestions, feedback or other information that you provide to us relating to the Site or the Services is provided to us on a non-confidential and unrestricted basis. You also may provide information to be published or displayed (hereinafter, "'),
                        React.createElement("span", {className: "bold"}, 'posted'),
                        React.createElement("span", {className: "botbold"}, '") on public areas of the, or transmitted to other users of the Services or third parties (collectively, "'),
                        React.createElement("span", {className: "bold"}, 'User Contributions'),
                        React.createElement("span", {className: "botbold"}, '"). Please note that information (including personal information) that you choose to post as part of a User Contribution is by nature information that you have decided to make public and, therefore, is not subject to the restrictions on use or disclosure under this Privacy Policy.  Your User Contributions are posted and transmitted to others at your own risk. We cannot control the actions of other users of the Service with whom you may choose to share your User Contributions. Therefore, we cannot and do not guarantee that your User Contributions will not be viewed by unauthorized persons.')
                    ),
                    React.createElement("div", {className: "title-under"}, 'b. Information We May Collect Through Automatic Data Collection Technologies.'),
                    React.createElement("div", {className: "title-under"}, 'As you interact with or otherwise use the Services, we may use automatic data collection technologies to collect certain information about your equipment, browsing actions and patterns, including:'),
                    React.createElement("ul", {className: "second-number"}, 
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'Details of your interactions with the Services, including (i) pages, content and our other resources that you access and use, and (ii) traffic data, location data, logs and other communication data.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'Information about your computer and internet connection, including your IP address, operating system and browser type.')
                        )
                    ),
                    React.createElement("div", {className: "title-under"}, 'The information we collect automatically does not include personal information, but we may maintain it or associate it with personal information we collect in other ways or receive from third parties. It helps us to provide and improve the Services and to deliver a better and more personalized service, including by enabling us to:'),
                    React.createElement("ul", {className: "second-number"}, 
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'Estimate our audience size and usage patterns.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'Better understand your preferences and interests, allowing us to provide a more personalized experience for you.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "botbold"}, 'Recognize you when you return to the Site.')
                        )
                    ),
                    React.createElement("div", {className: "title-under"}, 'Some of the technologies we may use for this automatic data collection may include:'),
                    React.createElement("ul", {className: "second-number"}, 
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "bold"}, 'Cookies (or browser cookies). '),
                             React.createElement("span", {className: "bolsd"}, 'A cookie is a small file placed on the hard drive of your computer. You may refuse to accept browser cookies by activating the appropriate setting on your browser or device. However, if you select this setting you may be unable to access certain features or functionality of the Services. Unless you have adjusted your browser/device setting so that it will refuse cookies, our system may issue cookies when you direct your browser to our Site or interact with the Services.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "bold"}, 'Web Beacons. '),
                             React.createElement("span", {className: "bssold"}, 'Pages of our the Site and/or our e-mails may contain small electronic files known as web beacons (also referred to as clear gifs. pixel tags and single-pixel gifs) that permit us, for example, to count users who have visited those pages or opened an e-mail and for other related website statistics (for example, recording the popularity of certain website content and verifying system and server integrity). ')
                        )
                    ),
                    React.createElement("div", {className: "title-under"}, 'We do not collect personal information automatically, but we may tie this information to personal information about you that we collect from other sources or you provide to us.'),
                    React.createElement("div", {className: "title-under-bold"}, 'c. Information Provided to Us by Third Parties'),
                    React.createElement("div", {className: "normal"}, 'We may receive information about you from others, including (i) service providers that furnish us with analytical information on users of the Services and (ii) social networking sites or services (such as Facebook, Twitter, and other social media providers) through which you may be permitted to interact with the Services.  These third parties may use cookies alone or in conjunction with web beacons or other tracking technologies to collect information about you.  We use the information provided to us by these third parties consistent with Section 4 (How We Use Your Information), and you hereby consent to our use of such information in such manner.  We do not control how these third parties themselves use or disclose the information they collected from or about you, nor is any such third party’s use or disclosure of such information subject to this Privacy Policy. ')
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 3 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Third-party Use of Cookies and Other Tracking Technologies."),
                    React.createElement("div", {className: "normal"}, 'Some content or applications on the Site may be served by third-parties, including advertisers, ad networks and servers, content providers and application providers. These third parties may use cookies alone or in conjunction with other tracking technologies to collect information about you when you use the Services. The information they collect may be associated with your personal information or they may collect information, including personal information, about your online activities over time and across different websites and other online services.  They may use this information to provide you with interest-based (behavioral) advertising or other targeted content. '),
                    React.createElement("div", {className: "normal"}, "We do not control these third parties' tracking technologies or how they may be used. If you have any questions about this, you should contact the responsible provider directly.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 4 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "How We Use Your Information"),
                    React.createElement("div", {className: "normal"}, 'We may use information that we collect about you or that you provide to us, including any personal information:'),
                    React.createElement("ul", {className: "second-number"}, 
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "bold"}, 'To operate and provide the Services.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'To develop and improve the Services and our other products and services.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'To communicate with you, and provide additional information that may be of interest to you, about us.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'To provide you with other information or services that you request from us.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'To provide you with technical support or administrative, account and security notices, including notice of changes to our Terms of Use or Privacy Policy or the products or services that we offer.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'To conduct our administrative and internal operations.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'To fulfill any other purpose for which you provide it.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'To comply with our obligations, as determined by us in good faith, under applicable law.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'To carry out our obligations and enforce our rights arising from any contracts entered into between you and us.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'In any other way we may describe when you provide the information.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'For any other purpose with your consent.')
                        )
                    )
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 5 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Disclosure of Your Information"),
                    React.createElement("div", {className: "normal"}, 'We may disclose aggregated information about our users, and information that does not identify any individual, without restriction.'),
                    React.createElement("div", {className: "normal"}, "We may disclose personal information that we collect or you provide as described in this Privacy Policy:"),
                    React.createElement("ul", {className: "second-number"}, 
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'To our contractors, service providers and other third parties we use to support the Site and the Services and who are bound by applicable law and/or contractual obligations to keep personal information confidential and use it only for the purposes for which we disclose it to them.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'For any other purpose disclosed by us when you provide the information.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'With your consent.')
                        )
                    ),
                    React.createElement("div", {className: "normal"}, "We also may disclose your personal information:"),
                    React.createElement("ul", {className: "second-number"}, 
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'To comply with any court order, law or legal process, including to respond to any government or regulatory request.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'To enforce or apply our Terms of Use or other contracts.')
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                             React.createElement("span", {className: "notbold"}, 'If we believe disclosure is necessary or appropriate to protect our rights, property, or safety, or that of our customers or others. ')
                        )
                    )
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 6 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Choices About How We Use and Disclose Your Information"),
                    React.createElement("div", {className: "normal"}, 'We strive to provide you with choices regarding the personal information you provide to us. We have created mechanisms to provide you with the following control over your information:'),
                    React.createElement("ul", {className: "second-number"}, 
                        React.createElement("li", {className: "second-number1"}, 
                            React.createElement("span", {className: "bold"}, 'Tracking Technologies. '),
                            React.createElement("span", {className: "notbold"}, "You can set your browser and/or device to refuse all or some cookies, or to alert you when cookies are being sent. To learn how you can manage your Flash cookie settings, visit the Flash player settings page on Adobe's website. If you disable or refuse cookies, please note that some portions of the Services may then be inaccessible or not function properly.")
                        ),
                        React.createElement("li", {className: "second-number1"}, 
                            React.createElement("span", {className: "bold"}, 'Social Networks. '),
                            React.createElement("span", {className: "bossld"}, 'If you register with us via a third party social networking platform (e.g., Facebook), you may be able to manage the information you share with us and the interactivity between the Services and your social networking account by using privacy settings and other tools that may be provided by the social networking platform that you are using.  By registering with us through a social networking platform, you grant to us the right to collect and use the information that has been made available to be shared with us through that social networking platform. ')
                        )
                    ),
                    React.createElement("div", {className: "normal"}, "We do not control third parties' collection or use of your information to serve interest-based advertising. However these third parties may provide you with ways to choose not to have your information collected or used in this way. You can learn more about how to opt out of receiving targeted ads from members of the Network Advertising Initiative (\"NAI\") on the NAI's website located at www.networkadvertising.org.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 7 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Accessing and Correcting Your Information"),
                    React.createElement("div", {className: "normal"}, 'If we have made user accounts available and you have set up a user account for the Services, you may use account features that may be available to review and change your personal information.  You also may send us an e-mail at jenaheath@gmail.com to request access to, correct or delete any personal information that you have provided to us.  Please note that in some instances we may only be able to delete your personal information by also deleting your user account. We may not accommodate a request to change information if we believe the change would violate any law or legal requirement or cause the information to be incorrect.  We will respond to your request within 30 days from the date you contact us.')
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 8 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Data Security"),
                    React.createElement("div", {className: "normal"}, 'We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration and disclosure.  However, no security measures are perfect or impenetrable.  Therefore, we cannot guarantee the security of personal information provided to or stored by us, and are not responsible for the circumvention of any privacy settings or security measures with respect to the Services or our systems. '),
                    React.createElement("div", {className: "normal"}, 'The safety and security of your information also depends on you. If we have given you (or if you have chosen) a password for access to certain portions of the Services, you are responsible for keeping this password confidential. We ask you not to share your password with anyone.')
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 9 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Changes to Our Privacy Policy"),
                    React.createElement("div", {className: "normal"}, "It is our policy to post any changes we make to our Privacy Policy on this page. If we make material changes to how we treat our users' personal information, we will notify you by e-mail to the e-mail address specified in your account and/or through a notice on the Site prior to the change becoming effective.  The date the Privacy Policy was last revised is identified at the top of the page. You are responsible for ensuring we have an up-to-date active and deliverable e-mail address for you and for periodically visiting this Privacy Policy to check for any changes. Your continued use of the Services after we make changes is deemed to be acceptance of those changes.")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 10 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Children Under the Age of 13"),
                    React.createElement("div", {className: "normal"}, "Our Website is not directed toward or otherwise intended to be used by children under 13 years of age. No one under 13 years of age may provide any personal information to or through the Services. We do not knowingly collect personal information from children under 13.  If we learn we have collected or received personal information from a child under 13 without verification of parental consent, we will take prompt action to delete that information.  ")
                )
            ),
            React.createElement("ol", {className: "first-number", "start" : 11 }, 
                React.createElement("li", {className: "first-number1"}, 
                    React.createElement("div", {className: "title-privacy"}, "Contact Information"),
                    React.createElement("div", {className: "normal"}, "If you have any questions or comments regarding this Privacy Policy or our privacy practices, please contact us: (i) by mail, at 6514 Santolina Cove, Austin, Texas 78731 ATTN: Jena Heath or (ii) by email, at jenaheath@gmail.com")
                )
            )
        )
    
    );
};

var StoryTeller = React.createClass({displayName: "StoryTeller",
    render: function () {
        var story_text = this.props.story_text ? processText(this.props.story_text)
            : React.createElement("p", null);

        var classname = "storyTeller";

        if (this.props.extra_classnames) {
            classname += " " + this.props.extra_classnames;
        }

        var photo = this.props.media.photo[0];
        var photo_url = photo.photo_file;
        //photo_url = photo_url.replace(/^(.+?\.(png|jpe?g)).*$/i, '$1');
        var photo_url_alt = photo.english_caption;
        var photo_caption = getCaption(photo);
        var headerName = this.props.english_name
        if(headerName == this.props.relationship_to_story.english_name) {
            headerName = '';
        }
        return (
            React.createElement("div", {className: classname}, 
                React.createElement(NameHeader, {english_name: headerName, 
                            chinese_name: this.props.chinese_name, 
                            pinyin_name: this.props.pinyin_name, 
                            header_tag: "h2", 
                            sub_header_tag: "h3"}), 
                React.createElement(RelationshipHeader, {english_name: this.props.relationship_to_story.english_name, 
                                    chinese_name: this.props.relationship_to_story.chinese_name}
                ), 

                React.createElement(Media, {media: this.props.media}), 

                React.createElement("div", {className: "photo-container"}, 
                    React.createElement("img", {src: photo_url, className: "photo", "alt" : photo_url_alt}), 

                    React.createElement("div", {className: "photo-caption"}, 
                        React.createElement("p", null, 
                            photo_caption
                        )
                    )
                ), 

                React.createElement("div", {className: "story-text"}, 
                    story_text
                )
            )
        );
    }
});

// TODO: make this non-global
var paginator_ajax_in_progress = false;

var PaginationSection = React.createClass({displayName: "PaginationSection",
    addItems: function () {
        if (this.state.next_url
            && !paginator_ajax_in_progress) { // if there's no next_url there's nothing left to add
            // paginator_ajax_in_progress keeps us from triggering
            // the same ajax request a billion times as a user scrolls
            paginator_ajax_in_progress = true;
            $.ajax({
                url: this.state.next_url,
                dataType: "json",
                crossDomain: true,
                success: function (data) {
                    if(data.next != null) {
                        data.next = data.next.replace("http://127.0.0.1:8000", "");
                        data.next = data.next.replace("https://127.0.0.1:8000", "");
                    }
                    this.setState({
                        items: this.state.items.concat(data.results.map(function (currentValue, index, array) {
                            var element_making_details = this.props.make_element(currentValue);
                            var Component = element_making_details.component;
                            var props = element_making_details.props;
                            return React.createElement(Component, React.__spread({},   props))
                        }, this)),
                        next_url: data.next
                    });
                    paginator_ajax_in_progress = false;
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error(this.props.url, status, err.toString());
                    paginator_ajax_in_progress = false;
                }.bind(this)
            });
        }
    },
    getInitialState: function () {
        return {
            items: [], next_url: this.props.initial_url
        };
    },
    componentDidMount: function () {
        this.addItems();
        $(window).on('DOMContentLoaded load resize scroll', this.onChange);
    },
    componentWillUnmount: function () {
        $(window).off('DOMContentLoaded load resize scroll', this.onChange);
    },
    componentWillReceiveProps: function (nextProps) {
        if (nextProps.initial_url !== this.props.initial_url) {
            this.setState({
                items: [],
                next_url: nextProps.initial_url
            });
        }
    },
    onChange: function () { // http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport/7557433#7557433
        if (!this.refs.monitor_div) return; // there are no divs in the paginator
        var domNode = React.findDOMNode(this.refs.monitor_div);
        var el = $(domNode);
        el = el.children();
        el = el.last();

        //special bonus for those using jQuery
        if (typeof jQuery === "function" && el instanceof jQuery) {
            el = el[0];
        }

        if (!el) this.addItems();
        var rect = el.getBoundingClientRect();

        // once the top-left corner of the dom is out of view this will actually be false,
        // but I think that should be ok for our purposes. As long as this fires once when they scroll past it,
        // we're fine
        var divY1 = rect.top;
        var divY2 = rect.top + rect.height;
        var windowY1 = 0;
        var windowY2 = $(window).height();

        // test to see if monitor_div is within or higher than the vertical range of the window
        // we actually don't care if it's visible, we just care that the user is out of content
        var monitor_div_is_visible = (
            (divY1 < windowY1) || (divY1 <= windowY2 && divY2 >= windowY1)
        );

        if (monitor_div_is_visible) {
            this.addItems();
        }
    },
    componentDidUpdate: function (prevProps, prevState) {
        // If the initial url changed after this pagination section was first mounted,
        // then we should be clearing its contents and starting over with the contents
        // we retrieve from the new initial url. The clearing of state.items and
        // the making of the new next_url are taken care of in componentWillReceiveProps.
        // But to avoid race conditions and hard-to-understand code, we must call
        // addItems after the component has rendered with this new state
        if (this.props.initial_url === this.state.next_url) this.addItems();
    },
    render: function () {
        // We can run into problems that aren't solvable
        // in the process of updating state while keeping this component reusable.
        // The specific case that caused me to introduce this
        // solution was when I needed paginated items in a specific bootstrap grid
        var items_as_rendered;
        if (this.props.items_prerender_processor)
            items_as_rendered = this.props.items_prerender_processor(this.state.items);
        else
            items_as_rendered = this.state.items;

        var class_string = this.props.class_string ? this.props.class_string : "";
        return (
            React.createElement("div", {className: class_string, ref: "monitor_div"}, 
                items_as_rendered
            )
        );
    }
});

var StoryCard = React.createClass({displayName: "StoryCard",
    render: function () {
        var stuff_to_add = [];
        var link = "#/adoptee/" + this.props.id.toString();
        var filename = this.props.photo_front_story.replace(/^.*[\\\/]/, '');
        var src = this.props.photo_front_story;
        //src = src.replace(/^(.+?\.(png|jpe?g)).*$/i, '$1');
        stuff_to_add.push(React.createElement("a", {href: link}, 
            React.createElement("div", { className: "story-block-hidden"}, 
                React.createElement("img", {src: src, 'alt': filename})
            )
        ));
       // stuff_to_add.push(React.createElement("img", {src: this.props.photo_front_story}));
       // stuff_to_add.push(React.createElement(Adoptee, {english_name: this.props.english_name, 
       //                            chinese_name: this.props.chinese_name, 
       //                            pinyin_name: this.props.pinyin_name}));
       
        stuff_to_add.push(React.createElement("p", null, 
            React.createElement("h1", null, 
                React.createElement("a", {href: link}, this.props.english_name)
            )
        ));
        if(this.props.front_story != null) {
            var story_text_ori = this.props.front_story.story_text.trim();
            story_text_ori = story_text_ori.replace(/ /g, " ");
            var countWords = story_text_ori.split(" ").length;
            var text_story1 = '';
            var maxLength = 150 // maximum number of characters to extract
            var trimmedString = story_text_ori.substr(0, maxLength);
            //trimmedString = trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" ")));
           // var lastFive = trimmedString.substr(trimmedString.length - 4
            var expString = story_text_ori.split(/\s+/,23);
            text_story1 = expString.join(" ");
            var lastIndex = text_story1.lastIndexOf(" ");
           
            text_story1 = text_story1.substring(0, lastIndex);
            //console.log(lastIndex);
            text_story1 = text_story1 + '...</p>';
           
            
            if (countWords > 23){
                //text_story1 = text_story1.replace("<span", "<p"); 
                //text_story1 = text_story1.replace("</span>", "</p>"); 
                var story_text = processTextStory(text_story1);
            } else {
                //story_text_ori = story_text_ori.replace("<span", "<p"); 
                //story_text_ori = story_text_ori.replace("</span>", "</p>"); 
                var story_text = processTextStory(story_text_ori);
            }
         
        } else {
            var story_text = "";
        }
       
        stuff_to_add.push(
            React.createElement("div", { className: "min-height-story"}, story_text)
        );

        // Translators: The ... that comes before
        var link_text = language === ENGLISH ? "read more" : "继续阅读";
        //var link_text = gettext("read more") + ' ';
       

        var class_string = this.props.className ? this.props.className : "";

        return (
            React.createElement("div", {className: class_string}, 
                stuff_to_add, 
                React.createElement("p", null, 
                    React.createElement("a", {href: link},
                        React.createElement("span", null, link_text + " "),
                        React.createElement("i", { className: "fa fa-caret-right", "aria-hidden": "true"})
                        
                    )
                ),
                React.createElement("div", {className: "social-media-story"},
                    React.createElement("ul", null,
                        React.createElement("li", null,
                            React.createElement("a", {"target": "_blank", href: 'https://www.instagram.com/ourchinastories/'}, 
                                React.createElement("i", { className: "fa fa-instagram", "aria-hidden": "true"})
                            )
                        ),
                        React.createElement("li", null,
                            React.createElement("a", {"target": "_blank", href: 'https://twitter.com/intent/tweet?text='+ DOMAIN}, 
                                React.createElement("i", { className: "fa fa-twitter", "aria-hidden": "true"})
                            )
                        ),
                        React.createElement("li", null,
                            React.createElement("a", {"target": "_blank", href: 'https://www.facebook.com/sharer/sharer.php?u='+ DOMAIN }, 
                                React.createElement("i", { className: "fa fa-facebook", "aria-hidden": "true"})
                            )
                        ),
                        React.createElement("li", null,
                            React.createElement("a", {"target": "_blank", href: 'https://soundcloud.com/profheath'}, 
                                React.createElement("i", { className: "fa fa-soundcloud", "aria-hidden": "true"})
                            )
                        )
                    )
                ) 
            )
        );
    }
});

var FrontPage = React.createClass({displayName: "FrontPage",
    mixins: [ReactRouter.Navigation],
    getInitialState:function(){
		return{
            value: "",
            search_url: ADOPTEE_LIST_ENDPOINT,
			query:'',
			filteredData: this.props.data
		}
	},
    handleChange: function (event) {
        this.setState({
            value: event.target.value
        });
     
    },
    handleSubmit: function(event) {
        this.setState({
            value: $('#srch-term').val()
        });
    },
   
    doSearch:function(queryText){
		console.log(queryText)
		//get query result
		var queryResult=[];
		this.props.data.forEach(function(person){
			if(person.name.toLowerCase().indexOf(queryText)!=-1)
			queryResult.push(person);
		});
		
		this.setState({
			query:queryText,
			filteredData: queryResult
		})
	},
    render: function () {
        // Translators: Summary of the site
        var summary = gettext("Since 1992, more than 140,000 children have left China for homes in some sixteen countries. Here, Chinese adoptees, their families and friends tell their stories.");
        // Translators: Button label
        var submit = gettext("Share Your Story");
        var submit_handle_click = function () {
            this.transitionTo("submit");
        }.bind(this);
        // Translators: Button label
        var about = gettext("Who We Are");
        var about_handle_click = function () {
            this.transitionTo("about");
        }.bind(this);
        var privacy_handle_click = function () {
            //this.transitionTo("privacy");
        }.bind(this);
        var story_card_maker = function (adoptee_list_json) {
            return (
            {
                "component": StoryCard,
                "props": {
                    "english_name": adoptee_list_json.english_name,
                    "chinese_name": adoptee_list_json.chinese_name,
                    "pinyin_name": adoptee_list_json.pinyin_name,
                    "id": adoptee_list_json.id,
                    "photo_front_story": adoptee_list_json.photo_front_story,
                    "front_story": adoptee_list_json.front_story,
                    "key": adoptee_list_json.id,
                    "className": "story-block"
                }
            }
            )
        };

        var items_prerender_processor = function (items) {
            var items_to_return = [];
            var ITEMS_IN_A_ROW = 10000;//3
            var columned_items_for_rows = items.map(function(item) {
                return (
                    React.createElement("div", {className: "col-md-4 col-sm-6"},  //front-page-card
                        item
                    )
                ) 
            });

            for (var i = 0; i < columned_items_for_rows.length; i += ITEMS_IN_A_ROW) {
                var end_slice_index = i + ITEMS_IN_A_ROW > columned_items_for_rows.length ?
                    columned_items_for_rows.length
                    : i + ITEMS_IN_A_ROW;
                var row_items = columned_items_for_rows.slice(i, end_slice_index);
                items_to_return.push(
                    React.createElement("div", {className: "row"}, 
                        row_items
                    )
                );
            }
            
            if(columned_items_for_rows.length == 0) {
                items_to_return.push(
                    React.createElement("div", {className: "row"}, 
                        React.createElement("div", {className: "col-md-4 col-sm-6"},  //front-page-card
                            React.createElement("span", null, ' Data not found')
                        )
                    )
                );
            }

            return items_to_return;
        };
        var url_list = ADOPTEE_LIST_ENDPOINT;
        if(this.state.value != '') {
            var url_list  = ADOPTEE_LIST_ENDPOINT
                .slice(0, ADOPTEE_LIST_ENDPOINT.indexOf("999999999"))
            + this.state.value + "/";
        }
        console.log(url_list);
        var paginator = React.createElement(PaginationSection, {
            make_element: story_card_maker, 
            initial_url: url_list, 
            items_prerender_processor: items_prerender_processor});

        var RouteHandler = ReactRouter.RouteHandler;
        var other_language_prompt = language === ENGLISH ? "中文" : "Switch to English";
        var other_language_link = language === ENGLISH ? "/zh-hans/#" : "/en/#";
        
        var our_language_prompt = language === ENGLISH ? "Our China Stories" : "我们的中国故事";
        var share_language_prompt = language === ENGLISH ? "Share Your Story" : "分享你的故事";
        var who_language_prompt = language === ENGLISH ? "Who We Are" : "关于我们";
        var pri_language_prompt = language === ENGLISH ? "Privacy Policy" : "Privacy Policy";
        var term_language_prompt = language === ENGLISH ? "Terms of Use" : "Terms of Use";
        //var search =  gettext("Search");
        var search = language === ENGLISH ? "Search" : "搜索";
        // Translators: Share text for twitter
        var twitter_share_link = "https://twitter.com/intent/tweet?text=" + encodeURI(gettext("Check out ourchinastories.com!"));
        var fb_share_link = "http://www.facebook.com/sharer/sharer.php?u=" + encodeURI("http://www.ourchinastories.com/");

        var admin = gettext("Admin");
        return (
            React.createElement("div", {className: "rooot"},
                React.createElement("nav", {className: "navbar navbar-inverse navbar-fixed-top"},
                    React.createElement("div", {className: "container"},
                        React.createElement("div", {className: "row"},
                            React.createElement("div", {className: "col-md-9"},
                                React.createElement("div", {className: "navbar-header"},
                                    React.createElement("button", { type: "button", className: "navbar-toggle", "data-toggle": "collapse","data-target": ".navbar-collapse"},
                                        React.createElement("span", { className: "sr-only"}, "Toggle navigation"),
                                        React.createElement("span", { className: "icon-bar"}),
                                        React.createElement("span", { className: "icon-bar"}),
                                        React.createElement("span", { className: "icon-bar"})
                                    )
                                ),
                                React.createElement("div", {className: "navbar-collapse collapse"},
                                    React.createElement("ul", {className: "nav navbar-nav"},
                                        React.createElement("li", {className: "active"},
                                            React.createElement("a", {href: other_language_link}, 
                                                React.createElement("i", { className: "fa fa-home", "aria-hidden": "true"})
                                            )
                                        ),
                                        React.createElement("li", null,
                                             React.createElement("a", {href: '/'}, our_language_prompt)
                                        ),
                                        React.createElement("li", null,
                                            React.createElement("a", {href: '#/submit', handle_click: submit_handle_click}, share_language_prompt)
                                        ),
                                        React.createElement("li", null,
                                            React.createElement("a", {href: '#/about', handle_click: about_handle_click}, who_language_prompt)
                                        ),
                                        React.createElement("li", null,
                                            React.createElement("div", {className: "input-group search-top"},
                                                React.createElement("input", {type: "text", className: "form-control", "placeholder": search, "name" : "srch_term", id : "srch-term"}),
                                                React.createElement("div", {className: "input-group-btn withauto"},
                                                        React.createElement("button", {type: "button", className: "btn btn-default", id : "srch-term-submit", onClick: this.handleSubmit},
                                                            React.createElement("i", { className: "glyphicon glyphicon-search" })
                                                       
                                                        )
                                                           
                                                )
                                             )
                                            //React.createElement(SearchForm, null) 
                                            
                                        )
                                    )
                                )
                            ),
                            React.createElement("div", {className: "col-md-3 social-media"},
                                React.createElement("ul", null,
                                    React.createElement("li", null,
                                        React.createElement("a", {href: 'https://www.instagram.com/ourchinastories/'}, 
                                            React.createElement("i", { className: "fa fa-instagram", "aria-hidden": "true"})
                                        )
                                    ),
                                    React.createElement("li", null,
                                        React.createElement("a", {href: 'https://twitter.com/intent/tweet?text=Check%20out%20ourchinastories.com!'}, 
                                            React.createElement("i", { className: "fa fa-twitter", "aria-hidden": "true"})
                                        )
                                    ),
                                    React.createElement("li", null,
                                        React.createElement("a", {"target": "_blank",href: 'https://www.facebook.com/groups/ourchinastories/'}, 
                                            React.createElement("i", { className: "fa fa-facebook", "aria-hidden": "true"})
                                        )
                                    ),
                                    React.createElement("li", null,
                                        React.createElement("a", {href: 'https://soundcloud.com/profheath'}, 
                                            React.createElement("i", { className: "fa fa-soundcloud", "aria-hidden": "true"})
                                        )
                                    )
                                ),
                                React.createElement("div", {className: "language"},
                                    React.createElement("a", {href: '/en/'}, 
                                        React.createElement("img", { src: EN_LOCATION}),
                                        React.createElement("span", null, ' EN')
                                    ),
                                    React.createElement("a", {href: '/zh-hans/'}, 
                                        React.createElement("img", { src: CHINA_LOCATION}),
                                        React.createElement("span", null, ' 中文')
                                    )
                                )
                            )
                        )
                    )
                ),
                React.createElement("section", {className: "header"},
                    React.createElement("div", {className: "container"},
                        React.createElement("div", {className: "row"},
                            React.createElement("div", {className: "col-md-12 logo text-center"},
                                React.createElement("a", {href: '/'}, 
                                    React.createElement("img", { src: LOGO_LOCATION})
                                )
                                
                            )
                        )
                    )
                ),
                React.createElement("section", {className: "banner"},
                    React.createElement("div", {className: "container"},
                        React.createElement("div", {className: "row"},
                            React.createElement("div", {className: "col-md-12 logo text-center"},
                                React.createElement("h1", null, summary)
                            )
                        )
                    )
                ),
                React.createElement("section", {className: "content-wrapper"},
                    React.createElement("div", {className: "container"},
                         paginator
                    )
                    
                ),
                React.createElement("section", {className: "footer"},
                    React.createElement("div", {className: "container"},
                        React.createElement("div", {className: "row"},
                            React.createElement("div", {className: "col-md-8"},
                                React.createElement("div", {className: "footer-links"},
                                    React.createElement("a", {href: '/'}, 'Home'),
                                    React.createElement("a", {href: '/'}, our_language_prompt),
                                    React.createElement("a", {href: '#/submit', handle_click: submit_handle_click}, share_language_prompt),
                                    React.createElement("a", {href: '#/about', handle_click: about_handle_click}, who_language_prompt),
                                    React.createElement("a", {href: '#/privacy', handle_click: privacy_handle_click}, pri_language_prompt),
                                    React.createElement("a", {href: '#/term', handle_click: privacy_handle_click}, term_language_prompt)
                                     
                                ),
                                React.createElement("div", {className: "copyright"},
                                    React.createElement("span", null, 'Copyright ©  2016 Our China Stories. All Rights Reserved.')
                                )
                            ),
                            React.createElement("div", {className: "col-md-4 social-media"},
                                React.createElement("ul", null,
                                    React.createElement("li", null,
                                        React.createElement("a", {href: 'https://www.instagram.com/ourchinastories/'}, 
                                            React.createElement("i", { className: "fa fa-instagram", "aria-hidden": "true"})
                                        )
                                    ),
                                    React.createElement("li", null,
                                        React.createElement("a", {href: 'https://twitter.com/intent/tweet?text=Check%20out%20ourchinastories.com!'}, 
                                            React.createElement("i", { className: "fa fa-twitter", "aria-hidden": "true"})
                                        )
                                    ),
                                    React.createElement("li", null,
                                        React.createElement("a", {"target": "_blank", href: 'https://www.facebook.com/groups/ourchinastories/'}, 
                                            React.createElement("i", { className: "fa fa-facebook", "aria-hidden": "true"})
                                        )
                                    ),
                                    React.createElement("li", null,
                                        React.createElement("a", {href: 'https://soundcloud.com/profheath'}, 
                                            React.createElement("i", { className: "fa fa-soundcloud", "aria-hidden": "true"})
                                        )
                                    )
                                ),
                                React.createElement("div", {className: "language"},
                                    React.createElement("a", {href: '/en/'}, 
                                        React.createElement("img", { src: EN_LOCATION}),
                                        React.createElement("span", null, ' EN')
                                    ),
                                    React.createElement("a", {href: '/zh-hans/'}, 
                                        React.createElement("img", { src: CHINA_LOCATION}),
                                        React.createElement("span", null, ' 中文')
                                    )
                                )
                            )
                        )
                    )
                ),
                React.createElement(RouteHandler, null)
            )
        );
    }
});

var BootstrapModal = React.createClass({displayName: "BootstrapModal",
    mixins: [ReactRouter.Navigation],
    handleModalCloseRequest: function () {
        this.transitionTo("/");
    },
    render: function () {
        var class_name = "modal-content";

        if (this.props.extra_class) {
            class_name += " " + this.props.extra_class;
        }

        return (
            React.createElement(Modal, {
                isOpen: true, 
                className: "Modal__Bootstrap modal-lg", 
                onRequestClose: this.handleModalCloseRequest
                }, 
                React.createElement("div", {className: class_name}, 
                    React.createElement("div", {className: "container-fluid"}, 
                        React.createElement("div", {id: "close-row"}, 
                            React.createElement("div", {className: "x-icon", onClick: this.handleModalCloseRequest})
                        ), 
                        this.props.children
                    )
                )
            )
        );
    }
});

var AdopteeDetail = React.createClass({displayName: "AdopteeDetail",
    componentDidMount: function () {
        $.ajax({
            url: ADOPTEE_DETAIL_ENDPOINT.replace("999999999",
                this.props.params.id.toString()),
            dataType: "json",
            success: function (data) {
                this.setState({
                    english_name: data.english_name,
                    pinyin_name: data.pinyin_name,
                    chinese_name: data.chinese_name,
                    stories: data.stories
                })
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(this.props.url, status, err.toString());
            }.bind(this)
        });
    },
    getInitialState: function () {
        return {
            english_name: null,
            chinese_name: null,
            pinyin_name: null,
            stories: []
        }
    },
    render: function () {
        var story_components = this.state.stories.map(function(story, i, arr) {
            var extra_class;
            if (i === 0) extra_class = "first";
            else if (i === arr.length - 1) extra_class = "last";
            else extra_class = "middle";
            return (
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement(StoryTeller, {english_name: story.english_name, 
                                     chinese_name: story.chinese_name, 
                                     pinyin_name: story.pinyin_name, 
                                     relationship_to_story: story.relationship_to_story, 
                                     media: story.media, 
                                     story_text: story.story_text, 
                                     extra_classnames: extra_class}
                            )
                    )
                )
            );
        });
        //
        //var share_text = gettext("Share this story on Facebook or Twitter");
        //var order_of_headers;
        //if (language === ENGLISH)
        //    order_of_headers = [this.state.english_name, this.state.chinese_name,
        //        this.state.pinyin_name];
        //else
        //    order_of_headers = [this.state.chinese_name, this.state.pinyin_name, this.state.english_name];
        //
        //var twitter_share_link = "https://twitter.com/intent/tweet?text=" +
        //    encodeURI(interpolate(gettext("Check out %s's story at %s"),
        //                          [firstNonNullOrDefault(order_of_headers),
        //                           window.location.href]));
        //var fb_share_link = "http://www.facebook.com/sharer/sharer.php?u=" + encodeURI(window.location.href);

        //<div className="socialShareStory">
        //            <span>{share_text}</span>
        //            <a className="twitterButton socialButton" href={twitter_share_link}/>
        //            <a className="facebookButton socialButton" href={fb_share_link}/>
        //        </div>
        return (
            React.createElement(BootstrapModal, {
                extra_class: "detail-modal"}, 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement(Adoptee, {
                            english_name: this.state.english_name, 
                            chinese_name: this.state.chinese_name, 
                            pinyin_name: this.state.pinyin_name}
                            )
                    )
                ), 
                story_components

            )
        );
    }
});

var AboutPerson = React.createClass({displayName: "AboutPerson",
    render: function () {
        // TODO: This is scattered so many places. At the very least there should be a utility function to return the first non-null value from a list or a default value
        var caption_order_preference = language === ENGLISH ?
            [this.props.english_caption, this.props.chinese_caption] :
            [this.props.chinese_caption, this.props.english_caption];
        var caption = firstNonNullOrDefault(caption_order_preference, "");

        var text_order_preference = language === ENGLISH ?
            [this.props.about_text_english, this.props.about_text_chinese] :
            [this.props.about_text_chinese, this.props.about_text_english];
        var text = processText(firstNonNullOrDefault(text_order_preference, "<p></p>"));
        var class_name = "about-person";
        if (this.props.extra_class) {
            class_name += " " + this.props.extra_class;
        }

        return (
            React.createElement("div", {className: class_name}, 
                React.createElement(NameHeader, {
                    english_name: this.props.english_name, 
                    chinese_name: this.props.chinese_name, 
                    pinyin_name: this.props.pinyin_name, 
                    header_tag: "h2", 
                    sub_header_tag: "h3"}), 

                React.createElement("div", {className: "photo-container"}, 
                    React.createElement("img", {src: this.props.photo, className: "photo"}), 

                    React.createElement("div", {className: "photo-caption"}, 
                        React.createElement("p", null, 
                            caption
                        )
                    )
                ), 
                React.createElement("div", {className: "about-text-container"}, 
                    text
                )
            )
        );
    }
});

var AboutView = React.createClass({displayName: "AboutView",
    render: function () {
        var about_person_maker = function (about_person_json) {
            return (
            {
                "component": AboutPerson,
                "props": {
                    "english_name": about_person_json.english_name,
                    "chinese_name": about_person_json.chinese_name,
                    "pinyin_name": about_person_json.pinyin_name,
                    "about_text_english": about_person_json.about_text_english,
                    "about_text_chinese": about_person_json.about_text_chinese,
                    "english_caption": about_person_json.english_caption,
                    "chinese_caption": about_person_json.chinese_caption,
                    "photo": about_person_json.photo
                }
            }
            )
        };

        var items_prerender_processor = function (items) {
            return items.map(function (item, i, arr) {
                // This isn't the best idea but it's not terrible either for this case ...
                // https://facebook.github.io/react/docs/jsx-spread.html
                if (i === 0) {
                    item.props.extra_class = "first";
                } else if (i === arr.length - 1) {
                    item.props.extra_class = "last";
                } else {
                    item.props.extra_class = "middle";
                }
                return (
                    React.createElement("div", {className: "row"}, 
                        React.createElement("div", {className: "col-md-12"}, 
                            item
                        )
                    )
                );
            });
        };

        var who_we_are = gettext("Who We Are");

        return (
            React.createElement(BootstrapModal, {
                extra_class: "about-modal"}, 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("h3", {className: "whoWeAreTitle"}, who_we_are)
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement(PaginationSection, {
                            initial_url: ABOUT_PERSON_LIST_ENDPOINT, 
                            make_element: about_person_maker, 
                            items_prerender_processor: items_prerender_processor})
                    )
                )
            )
        );
    }
});

var AboutTerm = React.createClass({displayName: "AboutTerm",
    getInitialState: function() {
        return { data: null };
    },
    componentDidMount: function() {
       // $.get(PRIVACY_ENDPOINT).done(function(data) {
       //   this.setState({data: data});
       // }.bind(this));
    },
  
    render: function () {
        var who_we_are = gettext("Terms of Use");
        var text = processTextTerm();//this.state.data;
        //if(text != null) {
        //    text = processText(text);
        //}
        return (
            React.createElement(BootstrapModal, {
                extra_class: "about-modal"}, 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("h3", {className: "whoWeAreTitle"}, who_we_are)
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, text)
                )
            )
        );
        
    }
});

var AboutPrivacy = React.createClass({displayName: "AboutPrivacy",
    getInitialState: function() {
        return { data: null };
    },
    componentDidMount: function() {
        //$.get(PRIVACY_ENDPOINT).done(function(data) {
        //  this.setState({data: data});
        //}.bind(this));
    },
  
    render: function () {
        var who_we_are = gettext("Privacy Policy");
        var text = processTextPrivacy();//this.state.data;
        //if(text != null) {
        //    text = processText(text);
        //}
        return (
            React.createElement(BootstrapModal, {
                extra_class: "about-modal"}, 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("h3", {className: "whoWeAreTitle"}, who_we_are)
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, text)
                )
            )
        );
        
    }
});

// For debouncing certain ajax requests
// It fulfills the last function call and throws out the rest
// http://davidwalsh.name/javascript-debounce-function

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
var debounce = function (func, wait, immediate) {
    var timeout;
    return function () {
        var context = this, args = arguments;
        var later = function () {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

var AreaTextEditor = React.createClass({displayName: "AreaTextEditor",
    mixins: [ReactScriptLoaderMixin],
    getInitialState: function () {
        return {
            scriptLoading: true,
            scriptLoadError: false
        };
    },
    shouldComponentUpdate: function (nextProps, nextState) {
        return false;
    },
    getScriptURL: function () {
        return CK_EDITOR_URL;
    },
    onScriptLoaded: function () {
        this.setState({scriptLoading: false});
        this.forceUpdate(function () {
            CKEDITOR.replace("tellStoryTextArea");
        });
    },
    onScriptError: function () {
        this.setState({
            scriptLoading: false,
            scriptLoadError: true
        });
        this.forceUpdate();
    },
    getText: function () {
        return CKEDITOR.instances.tellStoryTextArea.getData()
    },
    render: function () {
        if (this.state.scriptLoading) {
            var text_editor_loading = gettext("Text editor loading");
            return React.createElement("div", {id: "tellStoryTextAreaLoading"}, text_editor_loading);
        } else if (this.state.scriptLoadError) {
            var error_message = gettext("There is a problem with your connectivity " +
                "or with the website");
            return React.createElement("div", {id: "tellStoryTextAreaError"}, error_message);
        } else {
            return React.createElement("textarea", {id: "tellStoryTextArea"});
        }
    }
});

var Thanks = React.createClass({displayName: "Thanks",
    mixins: [ReactRouter.Navigation],
    continueForward: function () {
        this.transitionTo("/");
    },
    render: function () {
        var thanks = gettext("Thank you for your time and your story." +
            " Your content will be reviewed and posted as soon as possible.");
        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-md-12"}, 
                    React.createElement("h4", null, thanks)
                )
            )
        );
    }
});

var mediaFormMethods = {
    is_valid: function (url) {
        return this.re_detect.test(url);
    },
    post_data: function () {
        if (this.is_valid(this.state.url))
            return this.state.url;
        else
            return null
    },
    getInitialState: function () {
        return {
            url: ""
        };
    },
    handleChange: function (event) {
        this.setState({
            url: event.target.value
        });
    },
    render: function () {
        var url_input_classname = this.is_valid(this.state.url) ?
            "valid" : "invalid";
        if (!this.props.wants_to_provide) return React.createElement("div", null);
        return (
            React.createElement("div", null, 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("h4", null, this.explanation_text)
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("input", {id: "mediaFormURLInput", 
                               value: this.state.url, 
                               onChange: this.handleChange, 
                               placeholder: this.default_url, 
                               className: url_input_classname})
                    )
                )
            )
        );
    }
};

var SoundcloudForm = React.createClass({displayName: "SoundcloudForm",
    mixins: [mediaFormMethods],
    re_detect: /^(http(s)?:\/\/(www\.)?)?soundcloud\.com\/.*/,
    default_url: gettext("Please paste a soundcloud url of your audio here"),
    explanation_text: gettext("Be sure you are in a quiet place with minimal background noise when you record " +
        "your SoundCloud clip. Your clip should not be longer than five minutes."),
});

var YoutubeForm = React.createClass({displayName: "YoutubeForm",
    mixins: [mediaFormMethods],
    re_detect: /^(http(s)?:\/\/)?(www\.|m\.)?youtu(\.?)be(\.com)?\/.*/,
    default_url: gettext("Please paste a youtube url of your video here"),
    explanation_text: gettext("When shooting your photo or YouTube video, be sure you are not standing with " +
        "light behind you. If you are using your phone to shoot video, be sure the phone is horizontal.")
});

// TODO: This could be named better and also probably shouldn't be a global variable
var get_value = function (text) {
    if ($.trim(text).length > 0) return text;
    return null;
};

var MediaUpload = React.createClass({displayName: "MediaUpload",
    MULTIMEDIA_FORMS: {
        soundcloud: {
            name: gettext("SoundCloud"),
            tag: SoundcloudForm,
            upload_field_name: "audio",
            endpoint: AUDIO_UPLOAD_ENDPOINT
        },
        youtube: {
            name: gettext("YouTube"),
            tag: YoutubeForm,
            upload_field_name: "video",
            endpoint: VIDEO_UPLOAD_ENDPOINT
        }
    },
    ENGLISH_PHOTO_CAPTION_DEFAULT: gettext("English caption for photo (if able)"),
    CHINESE_PHOTO_CAPTION_DEFAULT: gettext("Chinese caption for photo (if able)"),
    ENGLISH_CAPTION_DEFAULT: gettext("English caption for multimedia (if able)"),
    CHINESE_CAPTION_DEFAULT: gettext("Chinese caption for multimedia (if able)"),
    getInitialState: function () {
        return {
            wants_to_provide: true,
            selected_form: "soundcloud",
            english_caption: "",
            chinese_caption: "",
            photo_english_caption: "",
            photo_chinese_caption: "",
            photo_data_file: null
        };
    },
    handle_type_selection: function (event) {
        this.setState({
            selected_form: event.target.value
        });
    },
    provide: function (event) {
        this.setState({
            wants_to_provide: true
        });
    },
    dont_provide: function (event) {
        this.setState({
            wants_to_provide: false
        });
    },
    continueForward: function () {
        if (this.state.photo_data_file === null) return;
        var photo_upload_data = {
            english_caption: get_value(this.state.photo_english_caption),
            chinese_caption: get_value(this.state.photo_chinese_caption),
            story_teller: this.props.story_teller,
            photo_file: this.state.photo_data_file
        };
        var photo_upload_form_data = new FormData();
        var keys = Object.keys(photo_upload_data);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            photo_upload_form_data.append(key, photo_upload_data[key]);
        }
        // TODO: Make this concurrent using promises rather than a callback hack
        var upload_and_transition = function (data) {
            if (!this.state.wants_to_provide) {
                this.props.transition({
                    tag: Thanks,
                    props: {}
                }, gettext("Finish"));
            } else {
                var upload_field = this.refs.multimedia_form.post_data();
                if (!upload_field) return; // not a valid upload
                var upload_data = {
                    english_caption: get_value(this.state.english_caption),
                    chinese_caption: get_value(this.state.chinese_caption),
                    story_teller: this.props.story_teller
                };
                var upload_field_name = this.MULTIMEDIA_FORMS[this.state.selected_form].upload_field_name;
                upload_data[upload_field_name] = upload_field;
                var endpoint = this.MULTIMEDIA_FORMS[this.state.selected_form].endpoint;
                $.ajax({
                    url: endpoint,
                    type: 'POST',
                    dataType: "json",
                    data: upload_data,
                    success: function (data) {
                        this.props.transition({
                            tag: Thanks,
                            props: {}
                        });
                    }.bind(this),
                    error: function (endpoint, xhr, status, err) {
                        console.error(endpoint, status, err.toString());
                    }.bind(this, endpoint)
                });
            }
        }.bind(this);
        $.ajax({
            url: PHOTO_UPLOAD_ENDPOINT,
            type: 'POST',
            dataType: "json",
            data: photo_upload_form_data,
            processData: false,
            contentType: false,
            success: upload_and_transition,
            error: function (endpoint, xhr, status, err) {
                console.error(endpoint, status, err.toString());
            }.bind(this, PHOTO_UPLOAD_ENDPOINT)
        });

    },
    handleEnglishChange: function (event) {
        this.setState({
            english_caption: event.target.value
        });
    },
    handleChineseChange: function (event) {
        this.setState({
            chinese_caption: event.target.value
        });
    },
    handlePhotoEnglishChange: function (event) {
        this.setState({
            photo_english_caption: event.target.value
        });
    },
    handlePhotoChineseChange: function (event) {
        this.setState({
            photo_chinese_caption: event.target.value
        });
    },
    handleFile: function (e) {
        var file = e.target.files[0];
        this.setState({
            photo_data_file: file
        });
    },
    render: function () {
        var do_you_wish_to_provide = gettext("Do you wish to provide a multimedia item (video or audio) " +
            "to accompany your story?");
        var no = gettext("No");
        var yes = gettext("Yes");
        var what_kind = gettext("Will the multimedia item be a YouTube video or SoundCloud clip?");
        var type_selection_options = [];
        $.each(Object.keys(this.MULTIMEDIA_FORMS), function (type_selection_options, i, key) {
            var form_option = this.MULTIMEDIA_FORMS[key];
            type_selection_options.push(React.createElement("option", {value: key, key: key}, form_option.name));
        }.bind(this, type_selection_options));

        var media_type_form = this.state.wants_to_provide ?
            [
                React.createElement("div", {id: "multimediaKindForm"}, 
                    React.createElement("div", {className: "row"}, 
                        React.createElement("div", {className: "col-md-12"}, 
                            React.createElement("h4", null, what_kind)
                        )
                    ), 
                    React.createElement("div", {className: "row"}, 
                        React.createElement("div", {className: "col-md-12"}, 
                            React.createElement("select", {value: this.state.selected_form, 
                                    onChange: this.handle_type_selection}, 
                                type_selection_options
                            )
                        )
                    )
                )
            ] :
            [];
        var dont_provide_multimedia_button_class = this.state.wants_to_provide ?
            this.props.inactive_button_class : this.props.active_button_class;
        var provide_multimedia_button_class = this.state.wants_to_provide ?
            this.props.active_button_class : this.props.inactive_button_class;

        var MultimediaFormTag = this.MULTIMEDIA_FORMS[this.state.selected_form].tag;
        var caption = this.state.wants_to_provide ?
            [React.createElement("input", {id: "multimediaEnglishCaption", 
                    onChange: this.handleEnglishChange, 
                    value: this.state.english_caption, 
                    placeholder: this.ENGLISH_CAPTION_DEFAULT}),
                React.createElement("input", {id: "multimediaChineseCaption", 
                       onChange: this.handleChineseChange, 
                       value: this.state.chinese_caption, 
                       placeholder: this.CHINESE_CAPTION_DEFAULT})] : [];
        var select_a_photo = gettext(
            "You must upload a correctly sized photo to proceed. " +
            "The photo should have a width and height greater than 400px " +
            "each, be no larger than 2.5 megabytes, and be a JPEG. If you need help sizing or uploading your photo, please contact the admin at ourchinastories@gmail.com"
        );
        return (
            React.createElement("div", null, 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        select_a_photo
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("input", {type: "file", id: "photoUploadField", onChange: this.handleFile})
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("input", {id: "photoEnglishCaption", 
                               onChange: this.handlePhotoEnglishChange, 
                               value: this.state.photo_english_caption, 
                               placeholder: this.ENGLISH_PHOTO_CAPTION_DEFAULT}), 
                        React.createElement("input", {id: "photoChineseCaption", 
                               onChange: this.handlePhotoChineseChange, 
                               value: this.state.photo_chinese_caption, 
                               placeholder: this.CHINESE_PHOTO_CAPTION_DEFAULT})
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("h4", null, do_you_wish_to_provide)
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("button", {id: "provideMultimediaButton", 
                                className: provide_multimedia_button_class, 
                                onClick: this.provide}, 
                            yes
                        ), 
                        React.createElement("button", {id: "dontProvideMultimediaButton", 
                                className: dont_provide_multimedia_button_class, 
                                onClick: this.dont_provide}, 
                            no
                        )
                    )
                ), 
                media_type_form, 
                React.createElement(MultimediaFormTag, {wants_to_provide: this.state.wants_to_provide, 
                                   ref: "multimedia_form"}), 

                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        caption
                    )
                )
            )
        );
    }
});

// TODO: This form is way too bloated and brittle. It should be broken out into various components with their own state and something like media form's post_data method
var EnterStoryForm = React.createClass({displayName: "EnterStoryForm",
    getInitialState: function () {
        return {
            categories: [],
            categories_loading: true,
            selected_category:this.CATEGORIES_ENUM.NONE_SELECTED,
            new_category_english: "",
            new_category_chinese: "",
            english_name: "",
            chinese_name: "",
            pinyin_name: "",
            email: ""
        };
    },
    getDefaultProps: function () {
        return {
            // Translators: Seen by person when creating a new relationship category
            new_category_english_text: gettext("Relationship category in English"),
            // Translators: Seen by person when creating a new relationship category
            new_category_chinese_text: gettext("Relationship category in Chinese"),
            english_name_text: gettext("Your name in English (optional)"),
            chinese_name_text: gettext("Your name in Chinese (optional)"),
            pinyin_name_text: gettext("Your name in Pinyin (optional)"),
            email_text: gettext("Your email")
        };
    },
    continueForward: function () {
        // TODO: All this validation is bs. Validation should be tied to specific fields so I can give meaningful error messages :-/
        if (parseInt(this.state.selected_category) === this.CATEGORIES_ENUM.NONE_SELECTED ||
            (parseInt(this.state.selected_category) === this.CATEGORIES_ENUM.OTHER &&
            !get_value(this.state.new_category_english) &&
            !get_value(this.state.new_category_chinese)) ||
            !get_value(this.refs.textArea.getText()) ||
            !this.emailIsValid(this.state.email)) return;

        var postStoryteller = function (category_id) {
            $.ajax({
                method: "POST",
                url: STORYTELLER_ENDPOINT,
                dataType: "json",
                data: {
                    relationship_to_story: category_id,
                    story_text: this.refs.textArea.getText(),
                    email: this.state.email,
                    related_adoptee: this.props.adoptee_id,
                    english_name: get_value(this.state.english_name),
                    chinese_name: get_value(this.state.chinese_name),
                    pinyin_name: get_value(this.state.pinyin_name)
                },
                success: function (data) {
                    this.props.transition({
                        tag: MediaUpload,
                        props: {story_teller: data.id}
                    });
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error(STORYTELLER_ENDPOINT, status, err.toString());
                }.bind(this)
            })
        }.bind(this);
        if (parseInt(this.state.selected_category) === this.CATEGORIES_ENUM.NONE_SELECTED) {
            // TODO: Since error is boilerplate on all our AJAX calls it can probably be implemented as part of ajaxSetup
            $.ajax({
                method: "POST",
                url: CATEGORY_ENDPOINT,
                dataType: "json",
                data: {
                    english_name: get_value(this.state.new_category_english),
                    chinese_name: get_value(this.state.new_category_chinese)
                },
                success: function (data) {
                    postStoryteller(data.id);
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error(CATEGORY_ENDPOINT, status, err.toString());
                }.bind(this)
            });
        } else {
            postStoryteller(this.state.selected_category)
        }
    },
    componentDidMount: function () {
        $.ajax({
            url: CATEGORY_ENDPOINT,
            dataType: "json",
            success: function (data) {
                this.setState({
                    categories: data,
                    categories_loading: false
                });
            }.bind(this),
            error: function (xhr, status, err) {
                console.error(CATEGORY_ENDPOINT, status, err.toString());
            }.bind(this)
        });
    },
    handleSelection: function (event) {
        this.setState({
            selected_category: event.target.value
        });
    },
    // to-do: Clean up the ridiculously non-DRY pattern here
    handleCategoryCreatorEnglishChange: function (event) {
        this.setState({
            new_category_english: event.target.value
        });
    },
    handleCategoryCreatorChineseChange: function (event) {
        this.setState({
            new_category_chinese: event.target.value
        });
    },
    handleEnglishNameChange: function (event) {
        this.setState({
            english_name: event.target.value
        });
    },
    handleChineseNameChange: function (event) {
        this.setState({
            chinese_name: event.target.value
        });
    },
    handlePinyinNameChange: function (event) {
        this.setState({
            pinyin_name: event.target.value
        });
    },
    handleEmailChange: function (event) {
        this.setState({
            email: event.target.value
        });
    },
    emailIsValid: function (email) {
        // http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
        var re = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
        return re.test(email);
    },
    CATEGORIES_ENUM: {
        "NONE_SELECTED": -1,
        "OTHER": -2
    },
    render: function () {
        var what_is_your_name = gettext("What is your name?");
        var what_is_your_email = gettext("What is your email?");
        var what_is_your_relationship = gettext("What is your relationship to the adoptee?");
        var enter_story_instructions = gettext("Please enter your story below. We recommend that you first" +
            " type in Word to avoid losing your work. You will have an opportunity " +
            "to upload multimedia in the next prompt. ");
        var categories;
        if (this.state.categories_loading) {
            var loading = gettext("Loading");
            categories = [React.createElement("option", {value: this.CATEGORIES_ENUM.NONE_SELECTED}, loading)]
        }
        else {
            categories = [];
            var select_a_category = gettext("Select relationship");
            categories.push(React.createElement("option", {value: this.CATEGORIES_ENUM.NONE_SELECTED, 
                                    key: this.CATEGORIES_ENUM.NONE_SELECTED}, 
                                select_a_category
                            ));
            categories.push(this.state.categories.map(function (json, i, arr) {
                var order_of_names;
                if (language === ENGLISH)
                    order_of_names = [json.english_name, json.chinese_name];
                else
                    order_of_names = [json.chinese_name, json.english_name];
                var name = firstNonNullOrDefault(order_of_names, null);
                return React.createElement("option", {value: json.id, key: json.id}, name);
            }));
            var other = gettext("Other relationship");
            categories.push(React.createElement("option", {value: this.CATEGORIES_ENUM.OTHER, 
                                    key: this.CATEGORIES_ENUM.OTHER}, 
                                other
                            ));
        }
        var other_category_creator;
        if (parseInt(this.state.selected_category) === this.CATEGORIES_ENUM.OTHER) {
            // Translators: Seen by person when creating a new relationship category
            var instructions = gettext("Please fill out the relationship " +
                "name in at least one language");
            other_category_creator = [
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("h4", null, instructions)
                    )
                ),
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("input", {value: this.state.new_category_english, 
                               placeholder: this.props.new_category_english_text, 
                               onChange: this.handleCategoryCreatorEnglishChange})
                    )
                ),
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("input", {value: this.state.new_category_chinese, 
                               placeholder: this.props.new_category_chinese_text, 
                               onChange: this.handleCategoryCreatorChineseChange})
                    )
                )
            ]
        } else {
            other_category_creator = [];
        }
        var email_class = this.emailIsValid(this.state.email) ? "validEmail" : "invalidEmail";
        return (
            React.createElement("div", null, 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("h4", null, what_is_your_name)
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("input", {value: this.state.english_name, 
                               placeholder: this.props.english_name_text, 
                               onChange: this.handleEnglishNameChange}), 
                        React.createElement("input", {value: this.state.chinese_name, 
                               placeholder: this.props.chinese_name_text, 
                               onChange: this.handleChineseNameChange}), 
                        React.createElement("input", {value: this.state.pinyin_name, 
                               placeholder: this.props.pinyin_name_text, 
                               onChange: this.handlePinyinNameChange})
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("h4", null, what_is_your_email)
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("input", {value: this.state.email, 
                               placeholder: this.props.email_text, 
                               onChange: this.handleEmailChange, 
                               className: email_class})
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("h4", null, what_is_your_relationship)
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("select", {value: this.state.selected_category, 
                                onChange: this.handleSelection}, 
                            categories
                        )
                    )
                ), 
                other_category_creator, 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        enter_story_instructions
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement(AreaTextEditor, {ref: "textArea"})
                    )
                )
            )
        );
    }
});

var AdopteeSearchListing = React.createClass({displayName: "AdopteeSearchListing",
    handleClick: function (event) {
        // Translators: which adoptee someone has selected to add to
        var text = gettext("Selected: %s");
        var names = [this.props.english_name, this.props.chinese_name, this.props.pinyin_name];
        var names_text = [];
        for (var i = 0; i < names.length; i++) {
            if (names[i])
                names_text.push(names[i]);
        }
        names_text = names_text.join(" ");
        text = interpolate(text, [names_text]);
        this.props.select_adoptee(this.props.id, text);
    },
    render: function () {
        var photo = this.props.photo;
        return (
            React.createElement("div", {className: "adopteeListing", onClick: this.handleClick}, 
                React.createElement(NameHeader, {header_tag: "h3", 
                            sub_header_tag: "h4", 
                            class_string: "adopteeListingName", 
                            english_name: this.props.english_name, 
                            chinese_name: this.props.chinese_name, 
                            pinyin_name: this.props.pinyin_name}), 

                React.createElement("div", {className: "adopteeListingPhoto"}, 
                    React.createElement("img", {src: photo})
                )
            )
        );
    }
});

var CreateAdopteeForm = React.createClass({displayName: "CreateAdopteeForm",
    getInitialState: function () {
        return {
            english_name: "",
            pinyin_name: "",
            chinese_name: "",
        }
    },
    getDefaultProps: function () {
        return {
            // Translators: Part of the adoptee creation form
            english_name_text: gettext("English Name (optional)"),
            // Translators: Part of the adoptee creation form
            pinyin_name_text: gettext("Pinyin Name (optional)"),
            // Translators: Part of the adoptee creation form
            chinese_name_text: gettext("Chinese Name (optional)")
        }
    },
    englishInputChange: function (event) {
        this.setState({english_name: event.target.value});
    },
    pinyinInputChange: function (event) {
        this.setState({pinyin_name: event.target.value});
    },
    chineseInputChange: function (event) {
        this.setState({chinese_name: event.target.value});
    },
    continueForward: function () {
        // TODO: Make this block duplicate posts
        // TODO: Refactor
        if (get_value(this.state.english_name) ||
            get_value(this.state.pinyin_name) ||
            get_value(this.state.chinese_name)) {
            $.ajax({
                url: ADOPTEE_CREATE_ENDPOINT,
                type: 'POST',
                dataType: "json",
                data: {
                    english_name: get_value(this.state.english_name),
                    chinese_name: get_value(this.state.chinese_name),
                    pinyin_name: get_value(this.state.pinyin_name)
                },
                success: function (data) {
                    this.props.transition({
                        tag: EnterStoryForm,
                        props: {adoptee_id: data.id}
                    });
                }.bind(this),
                error: function (xhr, status, err) {
                    console.error(ADOPTEE_CREATE_ENDPOINT, status, err.toString());
                }.bind(this)
            });
        }
    },
    render: function () {
        var what_is_name = gettext("What is the name of the adoptee connected to your story?");
        return (
            React.createElement("div", {className: "personCreatorContainer"}, 
                React.createElement("h4", null, what_is_name), 
                React.createElement("input", {className: "nameCreationInput", 
                       value: this.state.english_name, 
                       placeholder: this.props.english_name_text, 
                       onChange: this.englishInputChange}), 
                React.createElement("input", {className: "nameCreationInput", 
                       value: this.state.pinyin_name, 
                       placeholder: this.props.pinyin_name_text, 
                       onChange: this.pinyinInputChange}), 
                React.createElement("input", {className: "nameCreationInput", 
                       value: this.state.chinese_name, 
                       placeholder: this.props.chinese_name_text, 
                       onChange: this.chineseInputChange})
            )
        );
    }
});

var SearchForm = React.createClass({displayName: "SearchForm",
   
    getInitialState: function () {
        return {
            next_url: this.props.initial_url,
            items: [],
            value: "",
            search_url: ADOPTEE_SEARCH_ENDPOINT,
            selected_adoptee: null
        };
    },
    handleChange: function (event) {
        //this.setState({ srch_term: event.target.value})
        console.log(event.target.value);
        this.setState({
            value: event.target.value,
            selected_adoptee: null
        }, this.getAdoptees);
     
    },
    getAdoptees: debounce(function () {
        this.setState({
            search_url: ADOPTEE_SEARCH_ENDPOINT
                .slice(0, ADOPTEE_SEARCH_ENDPOINT.indexOf("999999999"))
            + this.state.value + "/"
        });
    }, 250),
    selectAdoptee: function (id, text) {
        this.setState({
            selected_adoptee: id,
            value: text
        });
    },
    handleSubmit: function(event) {
        event.preventDefault();
        if(this.state.value == '') {
            return;
        }
        var url  = ADOPTEE_LIST_ENDPOINT
                .slice(0, ADOPTEE_LIST_ENDPOINT.indexOf("999999999"))
            + this.state.value + "/";
        $.ajax({
                url: url,
                dataType: "json",
                url: url,
                success:function(data){
                    //this.props.doSearch(data);
                    /*
                    this.setState({
                        items: this.state.items.concat(data.results.map(function (currentValue, index, array) {
                            var element_making_details = this.props.make_element(currentValue);
                            var Component = element_making_details.component;
                            var props = element_making_details.props;
                            return React.createElement(Component, React.__spread({},   props))
                        }, this)),
                        next_url: data.next
                    });
                    */
                }.bind(this)
            });
    },
    
    render: function () {
        var search_result_maker = function (search_result_json) {
            return {
                "component": AdopteeSearchListing,
                "props": {
                    "english_name": search_result_json.english_name,
                    "chinese_name": search_result_json.chinese_name,
                    "pinyin_name": search_result_json.pinyin_name,
                    "photo": search_result_json.photo_front_story,
                    "id": search_result_json.id,
                    "select_adoptee": this.selectAdoptee
                }
            };
        }.bind(this);
      
       
        return (
            React.createElement("form", {"method": 'GET', "action": "/results/", className: "navbar-form", "role": "search"}, 
                React.createElement("div", {className: "input-group"},
                    React.createElement("input", {type: "text", className: "form-control", "placeholder": "Search", "name" : "srch_term", id : "srch-term", onChange: this.handleChange}),
                    React.createElement("div", {className: "input-group-btn"},
                            React.createElement("button", {type: "button", className: "btn btn-default", id : "srch-term-submit", onClick: this.handleSubmit},
                                React.createElement("i", { className: "glyphicon glyphicon-search" })
                           
                            )
                               
                    )
                 )
            )
        );
    }
});


var AddToAdopteeForm = React.createClass({displayName: "AddToAdopteeForm",
    getInitialState: function () {
        return {
            value: "",
            search_url: ADOPTEE_SEARCH_ENDPOINT,
            selected_adoptee: null
        };
    },
    handleChange: function (event) {
        this.setState({
            value: event.target.value,
            selected_adoptee: null
        }, this.getAdoptees);
    },
    getAdoptees: debounce(function () {
        this.setState({
            search_url: ADOPTEE_SEARCH_ENDPOINT
                .slice(0, ADOPTEE_SEARCH_ENDPOINT.indexOf("999999999"))
            + this.state.value + "/"
        });
    }, 250),
    selectAdoptee: function (id, text) {
        this.setState({
            selected_adoptee: id,
            value: text
        });
    },
    continueForward: function () {
        if (this.state.selected_adoptee) {
            this.props.transition({
                tag: EnterStoryForm,
                props: {adoptee_id: this.state.selected_adoptee}
            });
        }
    },
    render: function () {
        var search_result_maker = function (search_result_json) {
            return {
                "component": AdopteeSearchListing,
                "props": {
                    "english_name": search_result_json.english_name,
                    "chinese_name": search_result_json.chinese_name,
                    "pinyin_name": search_result_json.pinyin_name,
                    "photo": search_result_json.photo_front_story,
                    "id": search_result_json.id,
                    "select_adoptee": this.selectAdoptee
                }
            };
        }.bind(this);
        var dropdown = this.state.selected_adoptee ? []
            : React.createElement(PaginationSection, {make_element: search_result_maker, 
                                 initial_url: this.state.search_url, 
                                 class_string: "adopteeListingDropdown"});
        var what_is_name = gettext("What is the name of the adoptee connected to your story?");
        var name = gettext('Name');
        return (
            React.createElement("div", {className: "row"}, 
                React.createElement("div", {className: "col-md-12"}, 
                    React.createElement("div", {id: "personPickerContainer"}, 
                        React.createElement("h4", null, what_is_name), 
                        React.createElement("input", {type: "text", 
                               value: this.state.value, 
                               placeholder: name, 
                               onChange: this.handleChange, 
                               className: "form-control"}), 
                        dropdown
                    )
                )
            )
        );
    }
});

var ProvideForm = React.createClass({displayName: "ProvideForm",
    getInitialState: function () {
        return {other_content: true}
    },
    noOtherContent: function () {
        this.hasOtherContent(false);
    },
    otherContent: function () {
        this.hasOtherContent(true);
    },
    hasOtherContent: function (has_content) {
        this.setState({other_content: has_content});
    },
    continueForward: function () {
        this.refs.form.continueForward();
    },
    render: function () {
        var other_content_question = gettext("Does the adoptee in your story have other content on this site?");
        var no = gettext("No");
        var yes = gettext("Yes");
        var form = this.state.other_content ?
        {
            tag: AddToAdopteeForm,
            props: {
                active_button_class: this.props.active_button_class,
                inactive_button_class: this.props.inactive_button_class,
                transition: this.props.transition
            }
        }
            :
        {
            tag: CreateAdopteeForm,
            props: {
                active_button_class: this.props.active_button_class,
                inactive_button_class: this.props.inactive_button_class,
                transition: this.props.transition
            }
        };
        var no_other_content_class = this.state.other_content ? this.props.inactive_button_class
            : this.props.active_button_class;
        var other_content_class = this.state.other_content ? this.props.active_button_class
            : this.props.inactive_button_class;

        var FormTag = form.tag;
        var form_props = form.props;

        return (
            React.createElement("div", null, 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("h4", null, other_content_question)
                    )
                ), 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("button", {id: "hasOtherContentButton", 
                                className: other_content_class, 
                                onClick: this.otherContent}, 
                            yes
                        ), 
                        React.createElement("button", {id: "hasNoOtherContentButton", 
                                className: no_other_content_class, 
                                onClick: this.noOtherContent}, 
                            no
                        )
                    )
                ), 
                React.createElement(FormTag, React.__spread({},  form_props, {ref: "form"}))
            )
        );
    }
});

var ThanksForContacting = React.createClass({displayName: "ThanksForContacting",
    render: function () {
        var thank_you = gettext("Thank you for your contact information. We " +
            "will be in touch with you shortly.");
        return React.createElement("h4", null, thank_you)
    }
});

var SubmitStart = React.createClass({displayName: "SubmitStart",
    continueForward: function () {
        this.refs.form.continueForward();
    },
    render: function () {
        var form_props = {
            active_button_class: this.props.active_button_class,
            inactive_button_class: this.props.inactive_button_class,
            transition: this.props.transition
        };

        var tos = language === ENGLISH ? "By submitting your story to this site, you are agreeing to post your content publicly. You are also promising that the content is not plagiarized from anyone, that it does not infringe a copyright or trademark, and that it isn’t libelous or otherwise unlawful or misleading. You also agree to be bound by this site’s Terms of Use and Privacy Policy." : "在本网站提交您的故事，即表明您同意公开发布此内容。您同时承诺此内容并非抄袭，没有侵犯版权或商标权，无诽谤、非法或误导性。你同意遵守本网站的使用条款和隐私权规定。";
        var terms = gettext("Terms");
        var policy = gettext("Privacy Policy");
        var and = gettext(" and ");
        var privacy_handle_click = function () {
            //this.transitionTo("privacy");
        }.bind(this);
        return (
            React.createElement("div", null, 
                React.createElement(ProvideForm, React.__spread({},  form_props, {ref: "form"})), 

                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("p", {className: "tiny-tos"}, 
                            tos
                        ), 
                        React.createElement("div", null, 
                            React.createElement("a", {href: '#/term', handle_click: privacy_handle_click}, terms),
                            React.createElement("span", {className: "colorpink1"}, and),
                            React.createElement("a", {href: '#/privacy', handle_click: privacy_handle_click}, policy)
                           
                        )

                    )
                )
            )
        );
    }
});

var SubmitPrompt = React.createClass({displayName: "SubmitPrompt",
    CONTINUE_TEXT: gettext("Continue"),
    getInitialState: function () {
        return {
            content: {
                tag: SubmitStart,
                props: {}
            },
            continue_text: this.CONTINUE_TEXT
        }
    },
    getDefaultProps: function () {
        return {
            active_button_class: "button active",
            inactive_button_class: "button"
        }
    },
    transition: function (content, button_text) {
        this.setState({
            content: content
        });
        if (button_text)
            this.setState({
                continue_text: button_texts
            });
    },
    childContinue: function () {
        this.refs.content.continueForward();
    },
    render: function () {
        // Translators: Title of the modal for someone submitting a story to the site
        var tell_your_story = gettext("Tell Your Story");

        // Translators: Continue button on story submission modal
        var continue_text = this.state.continue_text;

        var ContentTag = this.state.content.tag;
        var content_props = this.state.content.props;
        content_props['active_button_class'] = this.props.active_button_class;
        content_props['inactive_button_class'] = this.props.inactive_button_class;
        content_props['transition'] = this.transition;
        return (
            React.createElement(BootstrapModal, {
                extra_class: "prompt-modal"}, 
                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("h3", {className: "promptTitle"}, tell_your_story)
                    )
                ), 
                React.createElement(ContentTag, React.__spread({},  content_props, {ref: "content"})), 

                React.createElement("div", {className: "row"}, 
                    React.createElement("div", {className: "col-md-12"}, 
                        React.createElement("button", {id: "continueButton", 
                                className: this.props.active_button_class, 
                                onClick: this.childContinue}, 
                            continue_text
                        )
                    )
                )
            )
        )
    }
});

var Route = ReactRouter.Route;

var routes = (
    React.createElement(Route, {handler: FrontPage}, 
        React.createElement(Route, {name: "adoptee", path: "adoptee/:id", handler: AdopteeDetail}), 
        React.createElement(Route, {name: "submit", path: "submit", handler: SubmitPrompt}), 
        React.createElement(Route, {name: "about", path: "about", handler: AboutView}),
        React.createElement(Route, {name: "term", path: "term", handler: AboutTerm}),
        React.createElement(Route, {name: "privacy", path: "privacy", handler: AboutPrivacy})
    )
);

var appElement = document.getElementById('root');
Modal.setAppElement(appElement);
Modal.injectCSS();


function analytics(state, options) {
    if (!options) {
        options = {};
    }
    options.page = state.path;
    ga('send', 'pageview', options);
}

ReactRouter.run(routes, ReactRouter.HashLocation, function (FrontPage, state) {
    React.render(React.createElement(FrontPage, null), appElement);
    // TODO: Analytics here
    // analytics(state)
});
React.initializeTouchEvents(true);